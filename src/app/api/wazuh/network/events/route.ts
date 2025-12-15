// src/app/api/wazuh/network/events/route.ts (UPDATED - Monitor Everything)
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
    const protocol = searchParams.get('protocol'); // tcp, udp, icmp
    const srcIp = searchParams.get('src_ip');
    const dstIp = searchParams.get('dst_ip');
    const port = searchParams.get('port');
    const days = parseInt(searchParams.get('days') || '7');

    console.log(`\n=== Network Events Request ===`);
    console.log(`Limit: ${limit}, Offset: ${offset}`);
    console.log(`Agent: ${agentId || 'all'}`);
    console.log(`Protocol: ${protocol || 'all'}`);
    console.log(`Period: Last ${days} days`);

    const now = new Date();
    const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const indexPattern = await getAlertIndexPattern();

    // Build query for ALL network events - capture everything with IP/port/protocol data
    const mustClauses: any[] = [
      {
        range: {
          timestamp: {
            gte: past.toISOString(),
            lte: now.toISOString(),
          },
        },
      },
    ];

    // Broad network event detection - look for ANY network-related fields
    const networkFieldsQuery: any = {
      bool: {
        should: [
          // IP addresses
          { exists: { field: 'data.src_ip' } },
          { exists: { field: 'data.srcip' } },
          { exists: { field: 'data.dst_ip' } },
          { exists: { field: 'data.dstip' } },
          
          // Ports
          { exists: { field: 'data.src_port' } },
          { exists: { field: 'data.srcport' } },
          { exists: { field: 'data.dst_port' } },
          { exists: { field: 'data.dstport' } },
          
          // Protocols
          { exists: { field: 'data.protocol' } },
          { exists: { field: 'data.proto' } },
          
          // Network-related rule groups
          { term: { 'rule.groups': 'firewall' } },
          { term: { 'rule.groups': 'ids' } },
          { term: { 'rule.groups': 'web' } },
          { term: { 'rule.groups': 'network' } },
          { term: { 'rule.groups': 'iptables' } },
          { term: { 'rule.groups': 'netfilter' } },
          { term: { 'rule.groups': 'suricata' } },
          { term: { 'rule.groups': 'zeek' } },
          
          // Windows network events
          { exists: { field: 'data.win.eventdata.sourceAddress' } },
          { exists: { field: 'data.win.eventdata.destinationAddress' } },
          { exists: { field: 'data.win.eventdata.sourcePort' } },
          { exists: { field: 'data.win.eventdata.destinationPort' } },
          
          // Connection/session data
          { exists: { field: 'data.connection' } },
          { exists: { field: 'data.session' } },
          { exists: { field: 'data.flow' } },
        ],
        minimum_should_match: 1,
      },
    };

    mustClauses.push(networkFieldsQuery);

    if (agentId) {
      mustClauses.push({
        term: {
          'agent.id': agentId,
        },
      });
    }

    if (protocol) {
      mustClauses.push({
        bool: {
          should: [
            { term: { 'data.protocol': protocol.toLowerCase() } },
            { term: { 'data.proto': protocol.toLowerCase() } },
          ],
        },
      });
    }

    if (srcIp) {
      mustClauses.push({
        bool: {
          should: [
            { term: { 'data.src_ip': srcIp } },
            { term: { 'data.srcip': srcIp } },
            { term: { 'data.win.eventdata.sourceAddress': srcIp } },
          ],
        },
      });
    }

    if (dstIp) {
      mustClauses.push({
        bool: {
          should: [
            { term: { 'data.dst_ip': dstIp } },
            { term: { 'data.dstip': dstIp } },
            { term: { 'data.win.eventdata.destinationAddress': dstIp } },
          ],
        },
      });
    }

    if (port) {
      mustClauses.push({
        bool: {
          should: [
            { term: { 'data.src_port': parseInt(port) } },
            { term: { 'data.dst_port': parseInt(port) } },
            { term: { 'data.srcport': parseInt(port) } },
            { term: { 'data.dstport': parseInt(port) } },
            { term: { 'data.win.eventdata.sourcePort': parseInt(port) } },
            { term: { 'data.win.eventdata.destinationPort': parseInt(port) } },
          ],
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
      data: hit._source.data,
      rule: hit._source.rule,
      full_log: hit._source.full_log,
      decoder: hit._source.decoder,
    }));

    console.log(`✓ Found ${total} network events (returning ${events.length})`);
    console.log('=== Request Complete ===\n');

    return NextResponse.json({
      data: events,
      total,
      offset,
      limit,
    });
  } catch (error: any) {
    console.error('\n=== Network Events Error ===');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('=== End Error ===\n');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch network events', 
        message: error.message,
        data: [],
        total: 0,
      },
      { status: 200 }
    );
  }
}
