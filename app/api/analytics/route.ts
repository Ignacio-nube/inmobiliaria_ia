import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
        return NextResponse.json({ error: 'from and to required' }, { status: 400 });
    }

    const supabase = await createClient();

    const [viewsRes, pagesRes, propsRes, searchesRes, totalRes] = await Promise.all([
        supabase.from('page_views').select('viewed_at')
            .gte('viewed_at', from)
            .lte('viewed_at', to)
            .order('viewed_at', { ascending: true }),
        supabase.from('page_views').select('page_path')
            .gte('viewed_at', from)
            .lte('viewed_at', to),
        supabase.from('page_views').select('property_id, properties(id, title, images)')
            .not('property_id', 'is', null)
            .gte('viewed_at', from)
            .lte('viewed_at', to),
        supabase.from('search_logs').select('query')
            .gte('searched_at', from)
            .lte('searched_at', to),
        supabase.from('page_views').select('id', { count: 'exact', head: true })
            .gte('viewed_at', from)
            .lte('viewed_at', to),
    ]);

    // Build daily views
    const dailyMap: Record<string, number> = {};
    (viewsRes.data || []).forEach(v => {
        const key = v.viewed_at.slice(0, 10);
        dailyMap[key] = (dailyMap[key] || 0) + 1;
    });

    // Fill missing dates  
    const start = new Date(from);
    const end = new Date(to);
    const dailyViews: { date: string; count: number }[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        dailyViews.push({ date: key, count: dailyMap[key] || 0 });
    }

    // Top pages
    const pageMap: Record<string, number> = {};
    (pagesRes.data || []).forEach(v => {
        const p = v.page_path || '/';
        pageMap[p] = (pageMap[p] || 0) + 1;
    });
    const topPages = Object.entries(pageMap)
        .sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([label, count]) => ({ label, count }));

    // Top properties with image + title
    const propMap: Record<string, { title: string; image: string | null; id: string; count: number }> = {};
    (propsRes.data || []).forEach((v: any) => {
        const pid = v.property_id;
        if (!pid) return;
        if (!propMap[pid]) {
            propMap[pid] = {
                title: v.properties?.title || 'Sin título',
                image: v.properties?.images?.[0] || null,
                id: pid,
                count: 0,
            };
        }
        propMap[pid].count++;
    });
    const topProperties = Object.values(propMap)
        .sort((a, b) => b.count - a.count).slice(0, 10);

    // Top searches
    const searchMap: Record<string, number> = {};
    (searchesRes.data || []).forEach(v => {
        searchMap[v.query] = (searchMap[v.query] || 0) + 1;
    });
    const topSearches = Object.entries(searchMap)
        .sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([label, count]) => ({ label, count }));

    return NextResponse.json({
        dailyViews,
        topPages,
        topProperties,
        topSearches,
        totalViews: totalRes.count || 0,
    });
}
