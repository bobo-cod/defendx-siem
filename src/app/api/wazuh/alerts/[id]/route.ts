// src/app/api/wazuh/alerts/[id]/route.ts (FIXED - Auto-detect index)
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
  timeout: 10000,
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

  try {
    // Try to detect the correct index pattern
    const patterns = [
      'wazuh-alerts-4.x-*',
      'wazuh-alerts-*',
      '.alerts-*',
      'wazuh-alerts-4*',
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
          console.log(`✓ Detected index pattern: ${pattern}`);
          return pattern;
        }
      } catch (e) {
        // Try next pattern
        continue;
      }
    }

    // Default fallback
    cachedIndexPattern = 'wazuh-alerts-*';
    console.warn('Could not detect index pattern, using default: wazuh-alerts-*');
    return cachedIndexPattern;
  } catch (error) {
    console.error('Error detecting index pattern:', error);
    return 'wazuh-alerts-*';
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getWazuhToken();
    
    const { id } = await params;
    const indexPattern = await getAlertIndexPattern();
    
    console.log(`Fetching alert by ID: ${id} from ${indexPattern}`);

    // Try searching by _id first
    try {
      const response = await axiosInstance.get(
        `${WAZUH_INDEXER_URL}/${indexPattern}/_doc/${id}`,
        {
          auth: {
            username: WAZUH_INDEXER_USERNAME,
            password: WAZUH_INDEXER_PASSWORD,
          },
        }
      );

      console.log(`✓ Alert found: ${id}`);
      
      return NextResponse.json({
        data: {
          _id: response.data._id,
          _index: response.data._index,
          _source: response.data._source,
        },
      });
    } catch (docError: any) {
      // If direct GET fails, try search
      console.log('Direct GET failed, trying search...');
      
      const searchResponse = await axiosInstance.post(
        `${WAZUH_INDEXER_URL}/${indexPattern}/_search`,
        {
          query: {
            term: {
              _id: id
            }
          },
          size: 1
        },
        {
          auth: {
            username: WAZUH_INDEXER_USERNAME,
            password: WAZUH_INDEXER_PASSWORD,
          },
        }
      );

      const hits = searchResponse.data.hits.hits;
      if (hits.length > 0) {
        console.log(`✓ Alert found via search: ${id}`);
        return NextResponse.json({
          data: hits[0],
        });
      }

      throw new Error('Alert not found');
    }
  } catch (error: any) {
    console.error('Alert fetch error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch alert', message: error.message },
      { status: error.response?.status || 500 }
    );
  }
}
