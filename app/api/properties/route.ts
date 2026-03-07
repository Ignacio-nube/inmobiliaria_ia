import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PAGE_SIZE = 20;

// ─── Fuzzy city matching ────────────────────────────────────
// Maps common colloquial or partial names to keywords found in DB city values
const CITY_KEYWORDS: Record<string, string> = {
    "san miguel": "San Miguel",
    "tucuman": "Tucum",
    "yerba buena": "Yerba",
    "yerba": "Yerba",
    "tafi viejo": "Taf",
    "tafi del valle": "Taf",
    "banda del rio": "Banda",
    "banda": "Banda",
    "alderetes": "Alderetes",
    "el manantial": "Manantial",
    "manantial": "Manantial",
    "las talitas": "Talitas",
    "talitas": "Talitas",
    "lules": "Lules",
    "famailla": "Famaill",
    "famaillá": "Famaill",
    "bella vista": "Bella Vista",
    "concepcion": "Concepci",
    "concepción": "Concepci",
    "aguilares": "Aguilares",
    "monteros": "Monteros",
    "san javier": "San Javier",
    "trancas": "Trancas",
    "alberdi": "Alberdi",
    "san pablo": "San Pablo",
};

function getCityKeyword(city: string): string {
    const clean = city
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    // Try longest match first (e.g. "san miguel" before "san")
    const sorted = Object.entries(CITY_KEYWORDS).sort(
        (a, b) => b[0].length - a[0].length
    );

    for (const [pattern, keyword] of sorted) {
        if (clean.includes(pattern)) {
            return keyword;
        }
    }

    // Fallback: use the original city string
    return city;
}

// ─── Build Supabase Query ───────────────────────────────────
interface QueryResult {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    relaxed: boolean;
    relaxedMessage?: string;
}

async function buildAndExecuteQuery(
    params: URLSearchParams,
    relaxLevel: number = 0
): Promise<QueryResult> {
    const supabase = await createClient();
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Start query — only published + approved
    let query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .eq('published', true)
        .eq('approval_status', 'approved');

    // ── propertyType ──
    const tipo = params.get('tipo');
    if (tipo && tipo !== 'all') {
        query = query.ilike('property_type', `%${tipo}%`);
    }

    // ── operationType ──
    const operacion = params.get('operacion');
    if (operacion && operacion !== 'all') {
        query = query.ilike('operation_type', `%${operacion}%`);
    }

    // ── minBedrooms ──  (skip on relaxLevel >= 2)
    const dormitorios = params.get('dormitorios');
    if (dormitorios && dormitorios !== 'any' && relaxLevel < 2) {
        const n = parseInt(dormitorios);
        if (!isNaN(n)) query = query.gte('bedrooms', n);
    }

    // ── minBathrooms ──  (skip on relaxLevel >= 2)
    const banos = params.get('banos');
    if (banos && banos !== 'any' && relaxLevel < 2) {
        const n = parseInt(banos);
        if (!isNaN(n)) query = query.gte('bathrooms', n);
    }

    // ── minGarage ──
    const cocheras = params.get('cocheras');
    if (cocheras && cocheras !== 'any' && relaxLevel < 2) {
        const n = parseInt(cocheras);
        if (!isNaN(n)) query = query.gte('garage', n);
    }

    // ── area (skip on relaxLevel >= 1) ──
    const supMin = params.get('supMin');
    if (supMin && relaxLevel < 1) {
        const n = parseInt(supMin);
        if (!isNaN(n)) query = query.gte('square_meters', n);
    }
    const supMax = params.get('supMax');
    if (supMax && relaxLevel < 1) {
        const n = parseInt(supMax);
        if (!isNaN(n)) query = query.lte('square_meters', n);
    }

    // ── condition ──
    const estado = params.get('estado');
    if (estado && estado !== 'all') {
        query = query.ilike('condition', `%${estado}%`);
    }

    // ── price (skip on relaxLevel >= 1) ──
    const precioMin = params.get('precioMin');
    if (precioMin && relaxLevel < 1) {
        const n = parseFloat(precioMin);
        if (!isNaN(n)) query = query.gte('price', n);
    }
    const precioMax = params.get('precioMax');
    if (precioMax && relaxLevel < 1) {
        const n = parseFloat(precioMax);
        if (!isNaN(n)) query = query.lte('price', n);
    }
    const moneda = params.get('moneda');
    if (moneda && moneda !== '' && relaxLevel < 1) {
        query = query.eq('currency', moneda);
    }

    // ── city (fuzzy, skip on relaxLevel >= 2) ──
    const ciudad = params.get('ciudad');
    if (ciudad && ciudad !== '' && relaxLevel < 2) {
        const keyword = getCityKeyword(ciudad);
        query = query.or(
            `city.ilike.%${keyword}%,location.ilike.%${keyword}%,address.ilike.%${keyword}%`
        );
    }

    // ── neighborhood (skip on relaxLevel >= 2) ──
    const barrio = params.get('barrio');
    if (barrio && barrio !== '' && relaxLevel < 2) {
        query = query.ilike('neighborhood', `%${barrio}%`);
    }

    // ── amenities (OR via overlaps, skip on relaxLevel >= 2) ──
    const amenitiesRaw = params.get('amenities');
    if (amenitiesRaw && relaxLevel < 2) {
        const amenitiesArr = amenitiesRaw.split(',').filter(Boolean);
        if (amenitiesArr.length > 0) {
            query = query.overlaps('amenities', amenitiesArr);
        }
    }

    // ── text search on title + description ──
    const q = params.get('q');
    if (q && q.trim() !== '') {
        const searchTerm = q.trim();
        query = query.or(
            `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        );
    }

    // ── ordering + pagination ──
    query = query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error('Supabase query error:', error);
        throw error;
    }

    return {
        data: data || [],
        total: count || 0,
        page,
        pageSize: PAGE_SIZE,
        relaxed: relaxLevel > 0,
        relaxedMessage: relaxLevel > 0
            ? 'No encontramos resultados exactos. Mostrando propiedades similares.'
            : undefined,
    };
}

// ─── FIX 5: Progressive fallback ────────────────────────────
async function searchWithFallback(params: URLSearchParams): Promise<QueryResult> {
    // Check if any meaningful filters are active
    const hasFilters = [
        'tipo', 'operacion', 'dormitorios', 'banos', 'cocheras',
        'supMin', 'supMax', 'estado', 'precioMin', 'precioMax',
        'moneda', 'ciudad', 'barrio', 'amenities', 'q'
    ].some(key => {
        const val = params.get(key);
        return val && val !== '' && val !== 'all' && val !== 'any';
    });

    // Attempt 1: All filters
    const result = await buildAndExecuteQuery(params, 0);
    if (result.data.length > 0 || !hasFilters) return result;

    // Attempt 2: Drop price + area
    const result2 = await buildAndExecuteQuery(params, 1);
    if (result2.data.length > 0) return result2;

    // Attempt 3: Only type + operation (drop city, bedrooms, amenities, etc.)
    const result3 = await buildAndExecuteQuery(params, 2);
    return result3;
}

// ─── GET handler ────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const params = req.nextUrl.searchParams;
        const result = await searchWithFallback(params);

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            },
        });
    } catch (error: any) {
        console.error('Properties API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch properties', data: [], total: 0, page: 1, pageSize: PAGE_SIZE, relaxed: false },
            { status: 500 }
        );
    }
}
