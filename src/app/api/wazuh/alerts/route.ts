// src/app/api/wazuh/alerts/route.ts (WITH SEPARATE INDEXER CREDS)
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

const WAZUH_API_URL = process.env.WAZUH_API_URL || 'https://192.168.1.8:55000';
const WAZUH_INDEXER_URL = process.env.WAZUH_INDEXER_URL || 'https://192.168.1.8:9200';
const WAZUH_API_USERNAME = process.env.WAZUH_API_USERNAME || 'wazuh';
const WAZUH_API_PASSWORD = process.env.WAZUH_API_PASSWORD || 'D*N*bU9VNVh*DhvC4r?.fyNFOa4J+?j*';
const WAZUH_INDEXER_USERNAME = process.env.WAZUH_INDEXER_USERNAME || 'admin';
const WAZUH_INDEXER_PASSWORD = process.env.WAZUH_INDEXER_PASSWORD || 'Eqt5N.sRzA8?qgeTLInrLUQ+2xohVxDV';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

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

export async function GET(request: NextRequest) {
  try {
    await getWazuhToken(); // Ensure we're authenticated
    
    const { searchParams } = new URL(request.url);
    
    // Parse search params
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const query = searchParams.get('q') || '';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const sort = searchParams.get('sort') || '-timestamp';

    // Build Elasticsearch query
    const mustQueries: any[] = [];
    
    // Add date range if provided
    if (dateFrom && dateTo) {
      mustQueries.push({
        range: {
          timestamp: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      });
    }

    // Parse the query string
    if (query) {
      if (query.includes('rule.level>=') && query.includes('AND rule.level<')) {
        const match = query.match(/rule\.level>=(\d+) AND rule\.level<(\d+)/);
        if (match) {
          mustQueries.push({
            range: {
              'rule.level': {
                gte: parseInt(match[1]),
                lt: parseInt(match[2]),
              },
            },
          });
        }
      } else if (query.includes('rule.level>=')) {
        const match = query.match(/rule\.level>=(\d+)/);
        if (match) {
          mustQueries.push({
            range: {
              'rule.level': {
                gte: parseInt(match[1]),
              },
            },
          });
        }
      } else if (query.includes('rule.level<')) {
        const match = query.match(/rule\.level<(\d+)/);
        if (match) {
          mustQueries.push({
            range: {
              'rule.level': {
                lt: parseInt(match[1]),
              },
            },
          });
        }
      } else if (query.includes(':')) {
        const [field, value] = query.split(':');
        mustQueries.push({
          match: {
            [field]: value,
          },
        });
      }
    }

    // Build sort
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';

    // Query Wazuh indexer
    const esQuery = {
      query: {
        bool: {
          must: mustQueries.length > 0 ? mustQueries : [{ match_all: {} }],
        },
      },
      size: limit,
      from: offset,
      sort: [{ [sortField]: sortOrder }],
    };

    console.log('Querying indexer with separate creds...');

    const response = await axiosInstance.post(
      `${WAZUH_INDEXER_URL}/wazuh-alerts-*/_search`,
      esQuery,
      {
        auth: {
          username: WAZUH_INDEXER_USERNAME,
          password: WAZUH_INDEXER_PASSWORD,
        },
      }
    );

    // Transform response
    const hits = response.data.hits.hits || [];
    const transformedData = {
      data: {
        affected_items: hits.map((hit: any) => ({
          _id: hit._id,
          _index: hit._index,
          _source: hit._source,
        })),
        total_affected_items: response.data.hits.total.value || 0,
        total_failed_items: 0,
        failed_items: [],
      },
      message: 'Success',
      error: 0,
    };

    console.log(`✓ Found ${transformedData.data.total_affected_items} alerts`);
    return NextResponse.json(transformedData);
  } catch (error: any) {
    console.error('Alerts API error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
      
      // Return helpful error message
      if (error.response.status === 401) {
        console.error('  ❌ Indexer credentials are incorrect!');
        console.error('  Try finding the password with:');
        console.error('  sudo cat /etc/wazuh-indexer/opensearch-security/internal_users.yml');
      }
    }
    
    // If no alerts found or auth error, return empty result
    if (error.response?.status === 404 || error.response?.status === 401) {
      return NextResponse.json({
        data: {
          affected_items: [],
          total_affected_items: 0,
          total_failed_items: 0,
          failed_items: [],
        },
        message: error.response?.status === 401 ? 'Unauthorized - check indexer credentials' : 'No alerts found',
        error: 0,
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch alerts', message: error.message },
      { status: 500 }
    );
  }
}