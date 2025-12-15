// src/app/api/wazuh/agents/route.ts (USING AXIOS)
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

const WAZUH_API_URL = process.env.WAZUH_API_URL || 'https://localhost:55000';
const WAZUH_USERNAME = process.env.WAZUH_API_USERNAME || 'admin';
const WAZUH_PASSWORD = process.env.WAZUH_API_PASSWORD || '';

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
          username: WAZUH_USERNAME,
          password: WAZUH_PASSWORD,
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
    const token = await getWazuhToken();
    const { searchParams } = new URL(request.url);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/agents?${queryString}` : '/agents';

    const response = await axiosInstance.get(
      `${WAZUH_API_URL}${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Agents API error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch agents', message: error.message },
      { status: 500 }
    );
  }
}
