// src/app/api/wazuh/vulnerabilities/route.ts
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
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const agentId = searchParams.get('agent_id');
    const severity = searchParams.get('severity'); // Critical, High, Medium, Low
    const cvssScore = searchParams.get('cvss_score'); // min score
    const days = parseInt(searchParams.get('days') || '30');

    console.log(`\n=== Vulnerabilities Request ===`);
    console.log(`Limit: ${limit}, Offset: ${offset}`);
    console.log(`Agent: ${agentId || 'all'}`);
    console.log(`Severity: ${severity || 'all'}`);
    console.log(`Period: Last ${days} days`);

    const now = new Date();
    const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const indexPattern = await getAlertIndexPattern();

    // Build query for vulnerability alerts
    const mustClauses: any[] = [
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
          field: 'data.vulnerability',
        },
      },
    ];

    if (agentId) {
      mustClauses.push({
        term: {
          'agent.id': agentId,
        },
      });
    }

    if (severity) {
      mustClauses.push({
        term: {
          'data.vulnerability.severity': severity.toLowerCase(),
        },
      });
    }

    if (cvssScore) {
      mustClauses.push({
        range: {
          'data.vulnerability.cvss.cvss3.base_score': {
            gte: parseFloat(cvssScore),
          },
        },
      });
    }

    const response = await axiosInstance.post(
      `${WAZUH_INDEXER_URL}/${indexPattern}/_search`,
      {
        from: offset,
        size: limit,
        query: {
          bool: {
            must: mustClauses,
          },
        },
        sort: [
          { 'data.vulnerability.cvss.cvss3.base_score': { order: 'desc' } },
          { timestamp: { order: 'desc' } },
        ],
      },
      {
        auth: {
          username: WAZUH_INDEXER_USERNAME,
          password: WAZUH_INDEXER_PASSWORD,
        },
      }
    );

    const total = response.data.hits.total.value;
    const vulnerabilities = response.data.hits.hits.map((hit: any) => ({
      id: hit._id,
      timestamp: hit._source.timestamp,
      agent: hit._source.agent,
      vulnerability: hit._source.data.vulnerability,
      rule: hit._source.rule,
    }));

    console.log(`✓ Found ${total} vulnerabilities (returning ${vulnerabilities.length})`);
    console.log('=== Request Complete ===\n');

    return NextResponse.json({
      data: vulnerabilities,
      total,
      offset,
      limit,
    });
  } catch (error: any) {
    console.error('\n=== Vulnerabilities Error ===');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('=== End Error ===\n');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch vulnerabilities', 
        message: error.message,
        data: [],
        total: 0,
      },
      { status: 200 }
    );
  }
}
