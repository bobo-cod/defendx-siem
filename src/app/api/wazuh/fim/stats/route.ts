// src/app/api/wazuh/fim/stats/route.ts
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
    throw new Error(`Failed to authenticate: ${error.message}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    await getWazuhToken();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const now = new Date();
    const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get FIM event counts by type
    const response = await axiosInstance.post(
      `${WAZUH_INDEXER_URL}/wazuh-alerts-*/_search`,
      {
        size: 0,
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
                term: {
                  'rule.groups': 'syscheck',
                },
              },
            ],
          },
        },
        aggs: {
          by_event_type: {
            terms: {
              field: 'syscheck.event',
              size: 10,
            },
          },
          by_agent: {
            terms: {
              field: 'agent.name',
              size: 10,
            },
          },
        },
      },
      {
        auth: {
          username: WAZUH_INDEXER_USERNAME,
          password: WAZUH_INDEXER_PASSWORD,
        },
      }
    );

    const total = response.data.hits.total.value;
    const eventTypes = response.data.aggregations?.by_event_type?.buckets || [];
    const agents = response.data.aggregations?.by_agent?.buckets || [];

    return NextResponse.json({
      total,
      by_event_type: eventTypes.map((b: any) => ({ type: b.key, count: b.doc_count })),
      by_agent: agents.map((b: any) => ({ agent: b.key, count: b.doc_count })),
    });
  } catch (error: any) {
    console.error('FIM stats error:', error.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch FIM stats',
        total: 0,
        by_event_type: [],
        by_agent: [],
      },
      { status: 200 }
    );
  }
}
