// src/app/api/wazuh/mitre/coverage/route.ts (FIXED - Non-nested arrays)
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

const WAZUH_API_URL = process.env.WAZUH_API_URL || 'https://localhost:55000';
const WAZUH_INDEXER_URL = process.env.WAZUH_INDEXER_URL || 'https://localhost:9200';
const WAZUH_API_USERNAME = process.env.WAZUH_API_USERNAME || 'admin';
const WAZUH_API_PASSWORD = process.env.WAZUH_API_PASSWORD || '';
const WAZUH_INDEXER_USERNAME = process.env.WAZUH_INDEXER_USERNAME || 'admin';
const WAZUH_INDEXER_PASSWORD = process.env.WAZUH_INDEXER_PASSWORD || 'admin';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;
let cachedIndexPattern: string | null = null;

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
  timeout: 15000,
});

async function getWazuhToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await axiosInstance.post(
      `${WAZUH_API_URL}/security/user/authenticate`,
      {},
      {
        auth: {
          username: WAZUH_API_USERNAME,
          password: WAZUH_API_PASSWORD,
        },
      }
    );

    cachedToken = response.data.data.token;
    tokenExpiry = Date.now() + 900000;
    return cachedToken;
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    throw new Error(`Failed to authenticate: ${error.message}`);
  }
}

async function getAlertIndexPattern(): Promise<string> {
  if (cachedIndexPattern) {
    return cachedIndexPattern;
  }

  const patterns = [
    'wazuh-alerts-4.x-*',
    'wazuh-alerts-*',
    '.alerts-*',
  ];

  for (const pattern of patterns) {
    try {
      const response = await axiosInstance.get(
        `${WAZUH_INDEXER_URL}/${pattern}/_search?size=1`,
        {
          auth: {
            username: WAZUH_INDEXER_USERNAME,
            password: WAZUH_INDEXER_PASSWORD,
          },
        }
      );

      if (response.data.hits.total.value > 0) {
        cachedIndexPattern = pattern;
        console.log(`✓ Using index pattern: ${pattern}`);
        return pattern;
      }
    } catch (e) {
      continue;
    }
  }

  cachedIndexPattern = 'wazuh-alerts-*';
  return cachedIndexPattern;
}

export async function GET(request: NextRequest) {
  try {
    await getWazuhToken();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    console.log(`\n=== MITRE Coverage Request ===`);
    console.log(`Period: Last ${days} days`);

    const now = new Date();
    const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const indexPattern = await getAlertIndexPattern();

    console.log(`Querying: ${WAZUH_INDEXER_URL}/${indexPattern}/_search`);

    // Get all alerts with MITRE data and process in-memory
    const response = await axiosInstance.post(
      `${WAZUH_INDEXER_URL}/${indexPattern}/_search`,
      {
        size: 1000, // Get up to 1000 alerts with MITRE data
        query: {
          bool: {
            must: [
              {
                range: {
                  timestamp: {
                    gte: past.toISOString(),
                    lte: now.toISOString(),
                  },
                },
              },
              {
                exists: {
                  field: 'rule.mitre.id',
                },
              },
            ],
          },
        },
        _source: ['rule.mitre', 'timestamp'],
      },
      {
        auth: {
          username: WAZUH_INDEXER_USERNAME,
          password: WAZUH_INDEXER_PASSWORD,
        },
      }
    );

    const totalHits = response.data.hits.total.value;
    const alerts = response.data.hits.hits;

    console.log(`Total alerts with MITRE mapping: ${totalHits}`);
    console.log(`Processing ${alerts.length} alerts...`);

    // Build technique and tactic maps
    const techniqueMap = new Map<string, { name: string; count: number; tactics: Set<string> }>();
    const tacticMap = new Map<string, number>();

    alerts.forEach((alert: any) => {
      const mitre = alert._source.rule?.mitre;
      if (!mitre) return;

      const ids = Array.isArray(mitre.id) ? mitre.id : [mitre.id];
      const techniques = Array.isArray(mitre.technique) ? mitre.technique : [mitre.technique];
      const tactics = Array.isArray(mitre.tactic) ? mitre.tactic : [mitre.tactic];

      // Process each technique ID
      ids.forEach((id: string, index: number) => {
        if (!id) return;

        const techniqueName = techniques[index] || techniques[0] || id;

        if (!techniqueMap.has(id)) {
          techniqueMap.set(id, {
            name: techniqueName,
            count: 0,
            tactics: new Set(),
          });
        }

        const techData = techniqueMap.get(id)!;
        techData.count++;
        
        // Add tactics for this technique
        tactics.forEach((tactic: string) => {
          if (tactic) {
            techData.tactics.add(tactic);
          }
        });
      });

      // Process tactics
      tactics.forEach((tactic: string) => {
        if (!tactic) return;
        tacticMap.set(tactic, (tacticMap.get(tactic) || 0) + 1);
      });
    });

    // Convert maps to arrays
    const techniques = Array.from(techniqueMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count,
      tactics: Array.from(data.tactics),
    }));

    const tactics = Array.from(tacticMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));

    // Sort by count (descending)
    techniques.sort((a, b) => b.count - a.count);
    tactics.sort((a, b) => b.count - a.count);

    console.log(`Found ${techniques.length} unique techniques`);
    console.log(`Found ${tactics.length} unique tactics`);

    // Log top 5 techniques
    if (techniques.length > 0) {
      console.log('\nTop 5 detected techniques:');
      techniques.slice(0, 5).forEach((t: any, i: number) => {
        console.log(`  ${i + 1}. ${t.id}: ${t.name} (${t.count} alerts)`);
      });
    }

    // Log all tactics
    if (tactics.length > 0) {
      console.log('\nDetected tactics:');
      tactics.forEach((t: any) => {
        console.log(`  - ${t.name}: ${t.count} alerts`);
      });
    }

    console.log('=== Request Complete ===\n');

    return NextResponse.json({
      techniques,
      tactics,
      total_alerts: totalHits,
      period_days: days,
      index_pattern: indexPattern,
    });
  } catch (error: any) {
    console.error('\n=== MITRE Coverage Error ===');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('=== End Error ===\n');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch MITRE coverage', 
        message: error.message,
        techniques: [],
        tactics: [],
        total_alerts: 0,
      },
      { status: 200 } // Return 200 to avoid error states in UI
    );
  }
}
