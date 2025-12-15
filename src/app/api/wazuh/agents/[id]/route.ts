// src/app/api/wazuh/agents/[id]/route.ts
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

// GET single agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getWazuhToken();
    const { id } = await params;

    console.log(`Fetching agent: ${id}`);

    const response = await axiosInstance.get(
      `${WAZUH_API_URL}/agents/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`✓ Agent fetched: ${id}`);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Agent fetch error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch agent', 
        message: error.response?.data?.detail || error.message 
      },
      { status: error.response?.status || 500 }
    );
  }
}

// DELETE agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getWazuhToken();
    const { id } = await params;

    console.log(`Deleting agent: ${id}`);

    // Delete the agent from Wazuh manager
    const response = await axiosInstance.delete(
      `${WAZUH_API_URL}/agents?agents_list=${id}&status=all&older_than=0s`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`✓ Agent deleted: ${id}`);

    return NextResponse.json({
      success: true,
      message: `Agent ${id} deleted successfully`,
      data: response.data,
    });
  } catch (error: any) {
    console.error('Agent deletion error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete agent', 
        message: error.response?.data?.detail || error.message 
      },
      { status: error.response?.status || 500 }
    );
  }
}

// PUT - Restart agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getWazuhToken();
    const { id } = await params;
    const body = await request.json();
    const action = body.action;

    console.log(`Agent ${id} action: ${action}`);

    if (action === 'restart') {
      const response = await axiosInstance.put(
        `${WAZUH_API_URL}/agents/${id}/restart`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`✓ Agent restarted: ${id}`);

      return NextResponse.json({
        success: true,
        message: `Agent ${id} restart command sent`,
        data: response.data,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Agent action error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to perform action', 
        message: error.response?.data?.detail || error.message 
      },
      { status: error.response?.status || 500 }
    );
  }
}
