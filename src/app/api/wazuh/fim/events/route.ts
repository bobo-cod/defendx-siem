// src/app/api/wazuh/fim/events/route.ts
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const agentId = searchParams.get('agent_id');
    const eventType = searchParams.get('event_type'); // added, modified, deleted
    const days = parseInt(searchParams.get('days') || '7');

    console.log(`\n=== FIM Events Request ===`);
    console.log(`Limit: ${limit}, Offset: ${offset}`);
    console.log(`Agent: ${agentId || 'all'}`);
    console.log(`Event Type: ${eventType || 'all'}`);
    console.log(`Period: Last ${days} days`);

    const now = new Date();
    const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const indexPattern = await getAlertIndexPattern();

    // Build query for FIM events (syscheck)
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
        term: {
          'rule.groups': 'syscheck',
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

    if (eventType) {
      mustClauses.push({
        term: {
          'syscheck.event': eventType,
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
    const events = response.data.hits.hits.map((hit: any) => ({
      id: hit._id,
      timestamp: hit._source.timestamp,
      agent: hit._source.agent,
      syscheck: hit._source.syscheck,
      rule: hit._source.rule,
    }));

    console.log(`✓ Found ${total} FIM events (returning ${events.length})`);
    console.log('=== Request Complete ===\n');

    return NextResponse.json({
      data: events,
      total,
      offset,
      limit,
    });
  } catch (error: any) {
    console.error('\n=== FIM Events Error ===');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('=== End Error ===\n');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch FIM events', 
        message: error.message,
        data: [],
        total: 0,
      },
      { status: 200 }
    );
  }
}
