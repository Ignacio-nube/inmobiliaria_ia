import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { page_path, property_id, search_query, referrer } = body;

        if (!page_path) {
            return NextResponse.json({ error: 'page_path required' }, { status: 400 });
        }

        // Create anonymous hash from IP + date (rotates daily for privacy)
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
        const dateStr = new Date().toISOString().slice(0, 10);
        const visitor_hash = crypto
            .createHash('sha256')
            .update(`${ip}-${dateStr}`)
            .digest('hex')
            .slice(0, 16);

        const user_agent = req.headers.get('user-agent') || null;

        const supabase = await createClient();
        const { error } = await supabase.from('page_views').insert({
            page_path,
            property_id: property_id || null,
            search_query: search_query || null,
            referrer: referrer || null,
            visitor_hash,
            user_agent,
        });

        if (error) {
            console.error('Track error:', error);
            return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Track API error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
