// src/app/api/wazuh/network/stats/route.ts (UPDATED - All Network Stats)
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

    // Get network event statistics - ALL network activity
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
                    
                    // Connection data
                    { exists: { field: 'data.connection' } },
                    { exists: { field: 'data.session' } },
                    { exists: { field: 'data.flow' } },
                  ],
                  minimum_should_match: 1,
                },
              },
            ],
          },
        },
        aggs: {
          by_protocol: {
            terms: {
              field: 'data.protocol',
              size: 50,
              missing: 'unknown',
            },
          },
          by_proto: {
            terms: {
              field: 'data.proto',
              size: 50,
            },
          },
          by_src_ip: {
            terms: {
              field: 'data.src_ip',
              size: 30,
            },
          },
          by_srcip: {
            terms: {
              field: 'data.srcip',
              size: 30,
            },
          },
          by_dst_ip: {
            terms: {
              field: 'data.dst_ip',
              size: 30,
            },
          },
          by_dstip: {
            terms: {
              field: 'data.dstip',
              size: 30,
            },
          },
          by_src_port: {
            terms: {
              field: 'data.src_port',
              size: 30,
            },
          },
          by_srcport: {
            terms: {
              field: 'data.srcport',
              size: 30,
            },
          },
          by_dst_port: {
            terms: {
              field: 'data.dst_port',
              size: 30,
            },
          },
          by_dstport: {
            terms: {
              field: 'data.dstport',
              size: 30,
            },
          },
          by_agent: {
            terms: {
              field: 'agent.name',
              size: 20,
            },
          },
          by_rule_group: {
            terms: {
              field: 'rule.groups',
              size: 30,
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
    
    // Merge protocol aggregations
    const protocolBuckets = [
      ...(response.data.aggregations?.by_protocol?.buckets || []),
      ...(response.data.aggregations?.by_proto?.buckets || []),
    ];
    
    // Deduplicate and count protocols
    const protocolMap = new Map<string, number>();
    protocolBuckets.forEach((bucket: any) => {
      const proto = bucket.key.toLowerCase();
      protocolMap.set(proto, (protocolMap.get(proto) || 0) + bucket.doc_count);
    });
    
    const protocols = Array.from(protocolMap.entries())
      .map(([protocol, count]) => ({ protocol, count }))
      .sort((a, b) => b.count - a.count);

    // Merge source IP aggregations
    const srcIpBuckets = [
      ...(response.data.aggregations?.by_src_ip?.buckets || []),
      ...(response.data.aggregations?.by_srcip?.buckets || []),
    ];
    
    const srcIpMap = new Map<string, number>();
    srcIpBuckets.forEach((bucket: any) => {
      const ip = bucket.key;
      if (ip && ip !== 'unknown') {
        srcIpMap.set(ip, (srcIpMap.get(ip) || 0) + bucket.doc_count);
      }
    });
    
    const srcIps = Array.from(srcIpMap.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count);

    // Merge destination IP aggregations
    const dstIpBuckets = [
      ...(response.data.aggregations?.by_dst_ip?.buckets || []),
      ...(response.data.aggregations?.by_dstip?.buckets || []),
    ];
    
    const dstIpMap = new Map<string, number>();
    dstIpBuckets.forEach((bucket: any) => {
      const ip = bucket.key;
      if (ip && ip !== 'unknown') {
        dstIpMap.set(ip, (dstIpMap.get(ip) || 0) + bucket.doc_count);
      }
    });
    
    const dstIps = Array.from(dstIpMap.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count);

    // Merge source port aggregations
    const srcPortBuckets = [
      ...(response.data.aggregations?.by_src_port?.buckets || []),
      ...(response.data.aggregations?.by_srcport?.buckets || []),
    ];
    
    const srcPortMap = new Map<number, number>();
    srcPortBuckets.forEach((bucket: any) => {
      const port = bucket.key;
      if (port) {
        srcPortMap.set(port, (srcPortMap.get(port) || 0) + bucket.doc_count);
      }
    });
    
    const srcPorts = Array.from(srcPortMap.entries())
      .map(([port, count]) => ({ port, count }))
      .sort((a, b) => b.count - a.count);

    // Merge destination port aggregations
    const dstPortBuckets = [
      ...(response.data.aggregations?.by_dst_port?.buckets || []),
      ...(response.data.aggregations?.by_dstport?.buckets || []),
    ];
    
    const dstPortMap = new Map<number, number>();
    dstPortBuckets.forEach((bucket: any) => {
      const port = bucket.key;
      if (port) {
        dstPortMap.set(port, (dstPortMap.get(port) || 0) + bucket.doc_count);
      }
    });
    
    const dstPorts = Array.from(dstPortMap.entries())
      .map(([port, count]) => ({ port, count }))
      .sort((a, b) => b.count - a.count);

    const agents = response.data.aggregations?.by_agent?.buckets || [];
    const ruleGroups = response.data.aggregations?.by_rule_group?.buckets || [];

    console.log(`\n=== Network Stats ===`);
    console.log(`Total: ${total}`);
    console.log(`Protocols: ${protocols.length}`);
    console.log(`Source IPs: ${srcIps.length}`);
    console.log(`Dest IPs: ${dstIps.length}`);
    console.log(`===================\n`);

    return NextResponse.json({
      total,
      by_protocol: protocols,
      top_src_ips: srcIps,
      top_dst_ips: dstIps,
      top_src_ports: srcPorts,
      top_dst_ports: dstPorts,
      by_agent: agents.map((b: any) => ({ agent: b.key, count: b.doc_count })),
      by_rule_group: ruleGroups.map((b: any) => ({ group: b.key, count: b.doc_count })),
    });
  } catch (error: any) {
    console.error('Network stats error:', error.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch network stats',
        total: 0,
        by_protocol: [],
        top_src_ips: [],
        top_dst_ips: [],
        top_src_ports: [],
        top_dst_ports: [],
        by_agent: [],
        by_rule_group: [],
      },
      { status: 200 }
    );
  }
}
