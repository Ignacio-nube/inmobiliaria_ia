import { NextRequest, NextResponse } from 'next/server';

// ── CORS proxies for sites that block server-side requests ──
const CORS_PROXIES = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

const BASE_DOMAIN = 'https://tucumanpropiedades.com.ar';
const DELAY_MS = 1200;
const FETCH_TIMEOUT = 25000;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function stripTags(str: string | null): string | null {
    return str ? str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim() : null;
}

async function fetchHTML(url: string): Promise<string | null> {
    const attempts = [
        url,
        ...CORS_PROXIES.map(proxy => proxy(url)),
    ];

    for (const attemptUrl of attempts) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            const res = await fetch(attemptUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
                },
            });
            clearTimeout(timeout);
            if (!res.ok) continue;
            const text = await res.text();
            if (text.length > 500) return text;
        } catch {
            continue;
        }
    }
    return null;
}

function extractPropertyLinks(html: string): string[] {
    const links = new Set<string>();
    const regex = /href=["'](?:https?:\/\/tucumanpropiedades\.com\.ar)?\/ad\/([^"'?#]+)["']/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        links.add(match[1]);
    }
    return Array.from(links);
}

function detectTotalPages(html: string): number {
    const regex = /[?&]page=(\d+)/g;
    let max = 1;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const n = parseInt(match[1]);
        if (n > max) max = n;
    }
    return max;
}

export interface ScrapedProperty {
    source_url: string;
    source_slug: string;
    scraped_at: string;
    title: string | null;
    property_code: string | null;
    price: number | null;
    currency: string | null;
    operation_type: string | null;
    property_type: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    square_meters: number | null;
    square_meters_covered: number | null;
    ambientes: number | null;
    is_monoambiente: boolean;
    description: string | null;
    amenities: string[];
    bedrooms: number | null;
    bathrooms: number | null;
    toilets: number | null;
    year_built: number | null;
    images: string[];
    expenses: number | null;
}

function parsePropertyDetail(html: string, slug: string): ScrapedProperty {
    const data: ScrapedProperty = {
        source_url: `${BASE_DOMAIN}/ad/${slug}`,
        source_slug: slug,
        scraped_at: new Date().toISOString(),
        title: null, property_code: null, price: null, currency: null,
        operation_type: null, property_type: null, address: null,
        city: null, province: 'Tucumán', square_meters: null,
        square_meters_covered: null, ambientes: null, is_monoambiente: false,
        description: null, amenities: [], bedrooms: null, bathrooms: null,
        toilets: null, year_built: null, images: [], expenses: null,
    };

    // ── TITLE ── (Priority: og:title > <title> tag > h5.color-secondery > h2)
    const ogTitleMatch = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    if (ogTitleMatch) {
        data.title = ogTitleMatch[1].trim();
    } else {
        // Try <title> tag (strip suffix like "  |  Site Name")
        const titleTagMatch = html.match(/<title[^>]*>\s*([^<|]+)/i);
        if (titleTagMatch) {
            data.title = titleTagMatch[1].trim();
        } else {
            // Fallback to h5 with color-secondery class
            const h5Match = html.match(/<h5[^>]*class=["'][^"']*color-secondery[^"']*["'][^>]*>([^<]+)<\/h5>/i);
            if (h5Match) {
                data.title = h5Match[1].trim();
            }
        }
    }

    // Clean title - remove trailing whitespace/punctuation
    if (data.title) {
        data.title = data.title.replace(/\s+$/, '').trim();
        // Remove any HTML entities
        data.title = stripTags(data.title) || data.title;
    }

    // ── CODE ──
    const codeMatch = html.match(/C[oó]digo:\s*(\d+)/i);
    data.property_code = codeMatch ? codeMatch[1] : null;

    // ── PRICE ──
    const priceBlockMatch = html.match(/(?:USD|U\$S|U\$D)\s*([\d.,]+)/i);
    if (priceBlockMatch) {
        data.currency = 'USD';
        data.price = parseFloat(priceBlockMatch[1].replace(/\./g, '').replace(',', '.')) || null;
    } else {
        const arsMatch = html.match(/\$\s*([\d.,]+)/);
        if (arsMatch) {
            data.currency = 'ARS';
            data.price = parseFloat(arsMatch[1].replace(/\./g, '').replace(',', '.')) || null;
        }
    }
    // Check for "Consultar Precio"
    if (html.match(/consultar\s*precio/i) || html.match(/>[\s]*Consultar[\s]*</i)) {
        data.price = null;
        data.currency = 'consultar';
    }

    // ── OPERATION TYPE ──
    const first5k = html.substring(0, 6000);
    if (/En\s*Venta|"purpose"\s*:\s*"sale"|class=["'][^"']*sale/i.test(first5k)) {
        data.operation_type = 'venta';
    } else if (/En\s*Alquiler|Alquiler\s*Temporal|"purpose"\s*:\s*"rent"/i.test(first5k)) {
        data.operation_type = html.match(/Alquiler\s*Temporal/i) ? 'alquiler_temporal' : 'alquiler';
    }

    // ── PROPERTY TYPE ──
    const types = ['Departamento', 'Casa', 'Terreno', 'Dúplex', 'Duplex', 'Oficina', 'Local', 'Obra Nueva', 'Cochera', 'PH', 'Galpón', 'Campo', 'Fondo de Comercio'];
    for (const t of types) {
        if (new RegExp(`>\\s*${t}\\s*<`, 'i').test(html)) {
            data.property_type = t;
            break;
        }
    }

    // ── ADDRESS ──
    // Strip meta/script/style/input tags first to only search visible text
    const visibleText = html
        .replace(/<meta[^>]*>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<input[^>]*>/gi, '')
        .replace(/<link[^>]*>/gi, '');
    const cities = ['San Miguel [Dd]e Tucum[aá]n', 'Yerba Buena', 'Taf[ií] Viejo', 'Las Talitas',
        'Banda del R[ií]o Sal[ií]', 'Lules', 'Famaill[aá]', 'Concepci[oó]n', 'Monteros',
        'Aguilares', 'Alberdi', 'Simoca', 'La Cocha', 'Juan Bautista Alberdi',
        'Bella Vista', 'Burruyac[uú]', 'Graneros', 'Leales', 'R[ií]o Chico',
        'Taf[ií] del Valle', 'Trancas', 'Chicligasta'];
    const cityPattern = cities.join('|');
    // Match text between > and < that contains a city name preceded by a comma
    const addressRegex = new RegExp(`>([^<]{3,100},\\s*(?:${cityPattern})[^<]{0,60})<`, 'i');
    const addressMatch = visibleText.match(addressRegex);
    if (addressMatch) {
        const fullAddress = addressMatch[1].replace(/\.$/, '').replace(/&[a-z]+;/gi, '').trim();
        const parts = fullAddress.split(',').map(p => p.trim());
        data.address = parts[0] || null;
        data.city = parts[1] || null;
        data.province = parts[2] || 'Tucumán';
    } else {
        // Try to extract city from visible text between tags
        const cityRegex = new RegExp(`>([^<]*(?:${cityPattern})[^<]*)<`, 'i');
        const locationMatch = visibleText.match(cityRegex);
        if (locationMatch) {
            const cityMatch = locationMatch[1].match(new RegExp(`(${cityPattern})`, 'i'));
            data.city = cityMatch ? cityMatch[0] : null;
        }
    }

    // ── SQUARE METERS fallback (if buttons didn't extract it) ──
    if (data.square_meters === null) {
        const sqmMatch = html.match(/([\d.,]+)\s*M²\s*Totales/i);
        data.square_meters = sqmMatch ? parseFloat(sqmMatch[1].replace(',', '.')) : null;
    }
    if (data.square_meters_covered === null) {
        const sqmCovMatch = html.match(/([\d.,]+)\s*M²\s*Cubiertos/i);
        data.square_meters_covered = sqmCovMatch ? parseFloat(sqmCovMatch[1].replace(',', '.')) : null;
    }

    // ── DESCRIPTION ──
    // Try og:description first (most reliable in raw HTML)
    const ogDescMatch = html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
    if (ogDescMatch && ogDescMatch[1].length > 30) {
        data.description = ogDescMatch[1].trim();
    } else {
        const descMatch = html.match(/Descripci[oó]n de la Propiedad<\/h[3-5]>\s*([\s\S]*?)(?:<\/section|<h[2-5]|<div[^>]*class="[^"]*(?:detail|feature|amenit))/i);
        if (descMatch) {
            data.description = stripTags(descMatch[1])?.substring(0, 5000) || null;
        }
    }

    // ── AMENITIES ──
    const detailSection = html.match(/[Mm]as\s+detalles<\/h5>([\s\S]*?)(?:<\/section>|<h[2-5])/i);
    if (detailSection) {
        const items = detailSection[1].match(/<(?:span|li|p|div|a)[^>]*>\s*([^<]{2,80})\s*<\//g);
        if (items) {
            data.amenities = items
                .map(item => stripTags(item)!)
                .filter(item => item && item.length > 1 && item.length < 100 && !/^\d+$/.test(item) && !/^\s*$/.test(item))
                .map(item => item.trim());
        }
    }

    // ── PROPERTY FEATURES (buttons with label + span.number pattern) ──
    // Raw HTML structure: Label text THEN <span class="number">N</span>
    // e.g.: Dormitorios\n<span class="number">\n2\n</span>
    // Use individual patterns for each feature for reliability
    const extractFeature = (label: string): number | null => {
        const regex = new RegExp(
            label + '[\\s\\S]{0,100}<span[^>]*class=["\'][^"\']*number[^"\']*["\'][^>]*>\\s*([\\d,.]+)\\s*</span>',
            'i'
        );
        const match = html.match(regex);
        if (match) {
            return parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        }
        return null;
    };

    const bedrooms = extractFeature('Dormitorio');
    if (bedrooms !== null) data.bedrooms = bedrooms;

    const ambientes = extractFeature('Ambiente');
    if (ambientes !== null) data.ambientes = ambientes;

    const banos = extractFeature('Ba[ñn]o');
    if (banos !== null) data.bathrooms = banos;

    const toilets = extractFeature('Toilet');
    if (toilets !== null) data.toilets = toilets;

    const m2Totales = extractFeature('M[²2]\\s*Totale');
    if (m2Totales !== null) data.square_meters = m2Totales;

    const m2Cubiertos = extractFeature('M[²2]\\s*Cubierto');
    if (m2Cubiertos !== null) data.square_meters_covered = m2Cubiertos;

    // Fallback: try plain text patterns if buttons weren't found
    if (data.bedrooms === null) {
        const bedFallback = html.match(/(\d+)\s*(?:Dormitorio|Habitaci[oó]n)/i);
        data.bedrooms = bedFallback ? parseInt(bedFallback[1]) : null;
    }
    if (data.bathrooms === null) {
        const bathFallback = html.match(/(\d+)\s*(?:Baño|Ba[ñn]o)/i);
        data.bathrooms = bathFallback ? parseInt(bathFallback[1]) : null;
    }
    if (data.ambientes === null) {
        const ambFallback = html.match(/(\d+)\s*(?:Ambiente)/i);
        data.ambientes = ambFallback ? parseInt(ambFallback[1]) : null;
    }

    // Monoambiente detection
    data.is_monoambiente = (
        (data.ambientes === 1 && (data.bedrooms === 0 || data.bedrooms === null)) ||
        /monoambiente/i.test(html)
    );
    if (data.is_monoambiente && !data.property_type) {
        data.property_type = 'Monoambiente';
    }

    // ── ANTIQUITY ──
    const antMatch = html.match(/Antig[üu]edad\s*(\d+)\s*a[ñn]os/i);
    data.year_built = antMatch ? (new Date().getFullYear() - parseInt(antMatch[1])) : null;

    // ── IMAGES ── (FIXED: search ALL upload paths globally, not just in gallery div)
    // Strategy: find all image URLs from the /uploads/ folder across the entire HTML
    const allUploadPaths = html.match(/uploads\/tucumanpropiedades\/images\/[^\s"'<>)]+/g);
    if (allUploadPaths) {
        const uniquePaths = [...new Set(allUploadPaths)]
            .filter(p => !p.includes('/thumbs/')) // exclude thumbnail versions
            .filter(p => /\.(jpg|jpeg|png|webp|gif)/i.test(p)); // only image extensions

        data.images = uniquePaths.map(p =>
            p.startsWith('http') ? p : `${BASE_DOMAIN}/${p}`
        );
    }

    // Fallback: any image on the same domain
    if (data.images.length === 0) {
        const domainImgRegex = /src=["'](https?:\/\/tucumanpropiedades\.com\.ar\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi;
        let imgM;
        while ((imgM = domainImgRegex.exec(html)) !== null) {
            const url = imgM[1];
            if (!url.includes('logo') && !url.includes('favicon') && !data.images.includes(url)) {
                data.images.push(url);
            }
        }
    }

    // ── EXPENSES ──
    const expMatch = html.match(/[Ee]xpensas[:\s]*\$?\s*([\d.,]+)/i);
    data.expenses = expMatch ? parseFloat(expMatch[1].replace(/\./g, '').replace(',', '.')) : null;

    return data;
}

// ── Stream-capable handler ──
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url, maxPages } = body as { url: string; maxPages?: number };

        if (!url) {
            return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const send = (data: Record<string, unknown>) => {
                    controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
                };

                send({ type: 'status', message: 'Obteniendo primera página...' });

                const firstPageHtml = await fetchHTML(url);
                if (!firstPageHtml) {
                    send({ type: 'error', message: 'No se pudo acceder a la URL. Verificá que sea accesible.' });
                    controller.close();
                    return;
                }

                const totalPages = maxPages || detectTotalPages(firstPageHtml);
                send({ type: 'status', message: `Detectadas ${totalPages} páginas` });

                const allSlugs = new Set<string>();
                extractPropertyLinks(firstPageHtml).forEach(s => allSlugs.add(s));
                send({ type: 'status', message: `Página 1: ${allSlugs.size} propiedades` });

                for (let page = 2; page <= totalPages; page++) {
                    await sleep(DELAY_MS);
                    const pageUrl = url.includes('?') ? `${url}&page=${page}` : `${url}?page=${page}`;
                    const pageHtml = await fetchHTML(pageUrl);
                    if (pageHtml) {
                        const before = allSlugs.size;
                        extractPropertyLinks(pageHtml).forEach(s => allSlugs.add(s));
                        send({ type: 'status', message: `Página ${page}: ${allSlugs.size - before} propiedades nuevas` });
                    } else {
                        send({ type: 'warning', message: `Página ${page}: no se pudo cargar` });
                    }
                }

                const slugList = Array.from(allSlugs);
                send({ type: 'status', message: `Total: ${slugList.length} propiedades únicas. Scrapeando detalles...` });

                const properties: ScrapedProperty[] = [];
                for (let i = 0; i < slugList.length; i++) {
                    const slug = slugList[i];
                    await sleep(DELAY_MS);
                    const html = await fetchHTML(`${BASE_DOMAIN}/ad/${slug}`);

                    if (html) {
                        try {
                            const prop = parsePropertyDetail(html, slug);
                            properties.push(prop);
                            const price = prop.price ? `${prop.currency} ${prop.price.toLocaleString()}` : 'Consultar';
                            send({
                                type: 'property',
                                index: i + 1,
                                total: slugList.length,
                                data: prop,
                                summary: `${prop.title || slug} | ${price} | 📷 ${prop.images.length}`,
                            });
                        } catch {
                            send({ type: 'error', message: `Error parseando ${slug}` });
                        }
                    } else {
                        send({ type: 'error', message: `No se pudo cargar /ad/${slug}` });
                    }
                }

                send({
                    type: 'complete',
                    total: properties.length,
                    properties,
                });
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            },
        });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Error interno' },
            { status: 500 }
        );
    }
}
