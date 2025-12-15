// src/app/api/wazuh/agents/summary/route.ts (USING AXIOS)
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

const WAZUH_API_URL = process.env.WAZUH_API_URL || 'https://localhost:55000';
const WAZUH_USERNAME = process.env.WAZUH_API_USERNAME || 'admin';
const WAZUH_PASSWORD = process.env.WAZUH_API_PASSWORD || '';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// Create axios instance with SSL disabled
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
  timeout: 10000,
});

async function getWazuhToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    console.log('✓ Using cached token');
    return cachedToken;
  }

  console.log('🔐 Attempting Wazuh authentication...');
  console.log('  URL:', WAZUH_API_URL);
  console.log('  Username:', WAZUH_USERNAME);

  try {
    const response = await axiosInstance.post(
      `${WAZUH_API_URL}/security/user/authenticate`,
      {},
      {
        auth: {
          username: WAZUH_USERNAME,
          password: WAZUH_PASSWORD,
        },
      }
    );

    if (response.data && response.data.data && response.data.data.token) {
      cachedToken = response.data.data.token;
      tokenExpiry = Date.now() + 900000; // 15 minutes

      console.log('✓ Authentication successful!');
      return cachedToken;
    } else {
      throw new Error('No token in response');
    }
  } catch (error: any) {
    console.error('❌ Authentication error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    }
    throw new Error(`Failed to authenticate: ${error.message}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('\n=== Agents Summary Request ===');
    
    const token = await getWazuhToken();

    console.log('📊 Fetching agents summary...');
    
    const response = await axiosInstance.get(
      `${WAZUH_API_URL}/agents/summary/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✓ Data received');
    console.log('  Total agents:', response.data.data?.affected_items?.[0]?.total || 0);
    console.log('=== Request Complete ===\n');
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('\n❌ API Route Error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch agents summary', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}
