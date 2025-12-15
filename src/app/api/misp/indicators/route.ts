// src/app/api/misp/indicators/route.ts
// MISP Threat Intelligence API for SIEM
import { NextRequest, NextResponse } from 'next/server';

const MISP_URL = process.env.MISP_URL || 'http://localhost:8080';
const MISP_API_KEY = process.env.MISP_API_KEY || '';

// Single indicator query
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const indicator = searchParams.get('indicator');
    const type = searchParams.get('type') || 'ip-dst';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!indicator) {
      return NextResponse.json(
        { error: 'Indicator parameter is required' },
        { status: 400 }
      );
    }

    if (!MISP_API_KEY) {
      return NextResponse.json(
        { error: 'MISP API key not configured' },
        { status: 500 }
      );
    }

    console.log(`Querying MISP for ${type}: ${indicator}`);

    // Query MISP
    const response = await fetch(`${MISP_URL}/attributes/restSearch`, {
      method: 'POST',
      headers: {
        'Authorization': MISP_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnFormat: 'json',
        type: type,
        value: indicator,
        published: true,
        limit: limit,
        enforceWarninglist: false,
      }),
    });

    if (!response.ok) {
      console.error(`MISP API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { 
          found: false,
          indicator,
          type,
          error: `MISP API returned ${response.status}`,
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    const attributes = data?.response?.Attribute || [];

    // Format threats
    const threats = attributes.map((attr: any) => ({
      id: attr.id,
      indicator: attr.value,
      type: attr.type,
      category: attr.category,
      event_id: attr.event_id,
      event_info: attr.Event?.info || 'N/A',
      threat_level: attr.Event?.threat_level_id || 'Unknown',
      analysis: attr.Event?.analysis || 'Unknown',
      timestamp: attr.timestamp,
      tags: attr.Tag?.map((tag: any) => tag.name) || [],
      comment: attr.comment || '',
      to_ids: attr.to_ids || false,
    }));

    console.log(`Found ${threats.length} threats for ${indicator}`);

    return NextResponse.json({
      found: threats.length > 0,
      indicator,
      type,
      threat_count: threats.length,
      threats,
    });

  } catch (error: any) {
    console.error('MISP query error:', error);
    return NextResponse.json(
      { 
        found: false,
        error: 'Failed to query MISP',
        message: error.message,
      },
      { status: 200 }
    );
  }
}

// Batch indicator query
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { indicators } = body;

    if (!indicators || !Array.isArray(indicators)) {
      return NextResponse.json(
        { error: 'Invalid request: indicators array required' },
        { status: 400 }
      );
    }

    if (!MISP_API_KEY) {
      return NextResponse.json(
        { error: 'MISP API key not configured' },
        { status: 500 }
      );
    }

    console.log(`Batch querying ${indicators.length} indicators`);

    // Query all indicators
    const results = await Promise.all(
      indicators.map(async (ind: { value: string; type: string }) => {
        try {
          const response = await fetch(`${MISP_URL}/attributes/restSearch`, {
            method: 'POST',
            headers: {
              'Authorization': MISP_API_KEY,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              returnFormat: 'json',
              type: ind.type || 'ip-dst',
              value: ind.value,
              published: true,
              limit: 10,
            }),
          });

          if (!response.ok) {
            return {
              indicator: ind.value,
              type: ind.type,
              found: false,
              error: `HTTP ${response.status}`,
            };
          }

          const data = await response.json();
          const attributes = data?.response?.Attribute || [];
          
          return {
            indicator: ind.value,
            type: ind.type,
            found: attributes.length > 0,
            threat_count: attributes.length,
            threats: attributes.slice(0, 5).map((attr: any) => ({
              event_info: attr.Event?.info || 'N/A',
              threat_level: attr.Event?.threat_level_id || 'Unknown',
              tags: attr.Tag?.map((t: any) => t.name) || [],
            })),
          };
        } catch (err: any) {
          return {
            indicator: ind.value,
            type: ind.type,
            found: false,
            error: err.message,
          };
        }
      })
    );

    const threatsFound = results.filter(r => r.found).length;
    console.log(`Batch query complete: ${threatsFound}/${results.length} threats found`);

    return NextResponse.json({
      results,
      total: results.length,
      threats_found: threatsFound,
    });

  } catch (error: any) {
    console.error('Batch query error:', error);
    return NextResponse.json(
      { error: 'Batch query failed', message: error.message },
      { status: 500 }
    );
  }
}
