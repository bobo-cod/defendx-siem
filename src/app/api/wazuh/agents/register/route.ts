// src/app/api/wazuh/agents/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

const WAZUH_API_URL = process.env.WAZUH_API_URL || 'https://localhost:55000';
const WAZUH_API_USERNAME = process.env.WAZUH_API_USERNAME || 'admin';
const WAZUH_API_PASSWORD = process.env.WAZUH_API_PASSWORD || '';

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

export async function POST(request: NextRequest) {
  try {
    const token = await getWazuhToken();
    const body = await request.json();
    
    const { name, ip = 'any' } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    console.log(`Registering new agent: ${name} with IP: ${ip}`);

    // Step 1: Register the agent
    const registerResponse = await axiosInstance.post(
      `${WAZUH_API_URL}/agents`,
      { name, ip },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const agentId = registerResponse.data.data.id;
    console.log(`✓ Agent registered with ID: ${agentId}`);

    // Step 2: Get the agent key
    const keyResponse = await axiosInstance.get(
      `${WAZUH_API_URL}/agents/${agentId}/key`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const agentKey = keyResponse.data.data.affected_items[0].key;
    console.log(`✓ Agent key retrieved for: ${name}`);

    return NextResponse.json({
      success: true,
      id: agentId,
      name,
      key: agentKey,
    });
  } catch (error: any) {
    console.error('Agent registration error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to register agent', 
        message: error.response?.data?.detail || error.message 
      },
      { status: error.response?.status || 500 }
    );
  }
}
