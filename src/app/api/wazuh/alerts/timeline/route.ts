// src/app/api/wazuh/alerts/timeline/route.ts
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
    console.error('Authentication error:', error.message);
    throw new Error(`Failed to authenticate: ${error.message}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    await getWazuhToken();

    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const interval = searchParams.get('interval') || '4h';

    console.log(`Fetching alert timeline for last ${hours} hours with ${interval} intervals`);

    const now = new Date();
    const past = new Date(now.getTime() - hours * 60 * 60 * 1000);

    // Query indexer for time-bucketed data
    const response = await axiosInstance.post(
      `${WAZUH_INDEXER_URL}/wazuh-alerts-*/_search`,
      {
        size: 0,
        query: {
          range: {
            timestamp: {
              gte: past.toISOString(),
              lte: now.toISOString(),
            },
          },
        },
        aggs: {
          alerts_over_time: {
            date_histogram: {
              field: 'timestamp',
              fixed_interval: interval,
              time_zone: 'UTC',
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

    const buckets = response.data.aggregations.alerts_over_time.buckets;

    const timeline = buckets.map((bucket: any) => ({
      timestamp: bucket.key_as_string || new Date(bucket.key).toISOString(),
      count: bucket.doc_count,
    }));

    console.log(`✓ Timeline data: ${timeline.length} data points`);

    return NextResponse.json({
      data: timeline,
      total: response.data.hits.total.value,
    });
  } catch (error: any) {
    console.error('Timeline fetch error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch timeline', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
}
