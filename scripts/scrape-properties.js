/**
 * Scraper para tucumanpropiedades.com.ar
 * 
 * Uso: node scripts/scrape-properties.js [url_base] [max_pages]
 * 
 * Ejemplo:
 *   node scripts/scrape-properties.js "https://tucumanpropiedades.com.ar/listing?state=24&city=&purpose=&type=&beds=-&q=&user_id=1208&shortBy=null&min_price=&max_price=" 5
 * 
 * Salida: scripts/scraped_properties.json
 */

const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────
const BASE_DOMAIN = 'https://tucumanpropiedades.com.ar';
const DEFAULT_URL = 'https://tucumanpropiedades.com.ar/listing?state=24&city=&purpose=&type=&beds=-&q=&user_id=1208&shortBy=null&min_price=&max_price=';
const DELAY_MS = 800; // delay between requests to be polite
const OUTPUT_FILE = path.join(__dirname, 'scraped_properties.json');

// ── Helpers ─────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function log(msg) {
    const ts = new Date().toLocaleTimeString();
    console.log(`[${ts}] ${msg}`);
}

/**
 * Fetch HTML with retries
 */
async function fetchHTML(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
                },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        } catch (err) {
            log(`  ⚠ Error fetching ${url}: ${err.message} (intento ${i + 1}/${retries})`);
            if (i < retries - 1) await sleep(2000);
        }
    }
    return null;
}

// ── Listing page parser ─────────────────────────────────────
/**
 * Extract property slugs/links from a listing page HTML
 */
function extractPropertyLinks(html) {
    const links = new Set();
    // Match all href="/ad/xxx" links
    const regex = /href=["']\/ad\/([^"']+)["']/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const slug = match[1];
        // Ignore duplicates and non-property links
        if (slug && !slug.includes('?') && !slug.includes('#')) {
            links.add(slug);
        }
    }
    return Array.from(links);
}

/**
 * Detect total number of pages from pagination HTML
 */
function detectTotalPages(html) {
    // Look for pagination links: &page=N
    const regex = /[?&]page=(\d+)/g;
    let maxPage = 1;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const pageNum = parseInt(match[1]);
        if (pageNum > maxPage) maxPage = pageNum;
    }
    return maxPage;
}

// ── Property detail parser ──────────────────────────────────

/**
 * Extract text between two patterns in HTML (simple approach)
 */
function extractBetween(html, startPattern, endPattern) {
    const startIdx = html.indexOf(startPattern);
    if (startIdx === -1) return null;
    const contentStart = startIdx + startPattern.length;
    const endIdx = html.indexOf(endPattern, contentStart);
    if (endIdx === -1) return null;
    return html.substring(contentStart, endIdx).trim();
}

/**
 * Strip HTML tags from a string
 */
function stripTags(str) {
    return str ? str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null;
}

/**
 * Parse a property detail page HTML to extract all data
 */
function parsePropertyDetail(html, slug) {
    const data = {
        source_url: `${BASE_DOMAIN}/ad/${slug}`,
        source_slug: slug,
        scraped_at: new Date().toISOString(),
    };

    // ── Title ──
    // Look for <h2> with the property title (usually the first h2)
    const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    data.title = h2Match ? stripTags(h2Match[1]) : null;

    // ── Code ──
    const codeMatch = html.match(/C[oó]digo:\s*(\d+)/i);
    data.property_code = codeMatch ? codeMatch[1] : null;

    // ── Price ──
    // Look for price patterns like "USD43.000" or "$ 200.000" or "Consultar"
    const priceBlockMatch = html.match(/(?:USD|U\$S|U\$D|\$)\s*([\d.,]+)/i);
    if (priceBlockMatch) {
        const priceStr = priceBlockMatch[0];
        // Determine currency
        if (/USD|U\$S|U\$D/i.test(priceStr)) {
            data.currency = 'USD';
        } else {
            data.currency = 'ARS';
        }
        // Extract numeric value, handling Argentine number format (dots as thousands, comma as decimal)
        const numericStr = priceBlockMatch[1].replace(/\./g, '').replace(',', '.');
        data.price = parseFloat(numericStr) || null;
    } else {
        // Check for "Consultar" / "Consultar Precio"
        data.price = null;
        data.currency = null;
    }

    // Refine: also check for explicit "Consultar" in price areas
    if (html.match(/consultar\s*precio/i) && !data.price) {
        data.price = null;
        data.currency = 'consultar';
    }

    // ── Operation type (Venta / Alquiler) ──
    if (/en\s*venta|venta/i.test(html.substring(0, 5000))) {
        data.operation_type = 'venta';
    } else if (/en\s*alquiler|alquiler\s*temporal/i.test(html.substring(0, 5000))) {
        data.operation_type = html.match(/alquiler\s*temporal/i) ? 'alquiler_temporal' : 'alquiler';
    } else {
        data.operation_type = null;
    }

    // ── Property type ──
    const propTypeMatch = html.match(/<(?:span|p|div)[^>]*>\s*(Departamento|Casa|Terreno|Dúplex|Duplex|Oficina|Local|Obra Nueva|Cochera|PH|Galpón|Campo|Fondo de Comercio)\s*<\//i);
    data.property_type = propTypeMatch ? propTypeMatch[1].trim() : null;

    // ── Address / Location ──
    // Full address line: "Santa Fe 100, San Miguel De Tucuman, Tucuman, Argentina."
    const addressMatch = html.match(/([^<>]{5,100},\s*(?:San Miguel [Dd]e Tucuman|Yerba Buena|Tafí Viejo|Las Talitas|Banda del Río Salí|Lules|Famaillá|Concepción|Monteros|Aguilares|Alberdi|Simoca)[^<>]{0,60})/i);
    if (addressMatch) {
        const fullAddress = addressMatch[1].replace(/\.$/, '').trim();
        const parts = fullAddress.split(',').map(p => p.trim());
        data.address = parts[0] || null;
        data.city = parts[1] || null;
        data.province = parts[2] || 'Tucumán';
    } else {
        // Fallback: try to extract from structured location data
        const locationMatch = html.match(/(?:San Miguel [Dd]e Tucuman|Yerba Buena|Tafí Viejo|Las Talitas|Banda del Río Salí|Lules|Famaillá|Concepción|Monteros)/i);
        data.city = locationMatch ? locationMatch[0] : null;
        data.address = null;
        data.province = 'Tucumán';
    }

    // ── Square meters ──
    const sqmMatch = html.match(/([\d.,]+)\s*M²\s*Totales/i);
    data.square_meters = sqmMatch ? parseFloat(sqmMatch[1].replace(',', '.')) : null;

    // ── Description ──
    // Look for the description section
    const descSection = html.match(/Descripci[oó]n de la Propiedad<\/h4>\s*([\s\S]*?)(?:<\/div>|<h[2-5]|<section)/i);
    if (descSection) {
        data.description = stripTags(descSection[1]).substring(0, 5000);
    } else {
        // Fallback: OG description
        const ogDesc = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/i);
        data.description = ogDesc ? ogDesc[1] : null;
    }

    // ── Amenities ──
    data.amenities = [];
    // Match the "Mas detalles" section and extract items
    const detailSection = html.match(/[Mm]as\s+detalles<\/h5>([\s\S]*?)(?:<\/section>|<h[2-5]|<\/div>\s*<\/div>\s*<\/div>\s*$)/i);
    if (detailSection) {
        const items = detailSection[1].match(/<(?:span|li|p|div)[^>]*>\s*([^<]{2,80})\s*<\//g);
        if (items) {
            data.amenities = items
                .map(item => stripTags(item))
                .filter(item => item && item.length > 1 && item.length < 100 && !/^\d+$/.test(item))
                .map(item => item.trim());
        }
    }

    // ── Bedrooms / Bathrooms ──
    const bedroomMatch = html.match(/(\d+)\s*(?:Dormitorio|Habitaci[oó]n)/i);
    data.bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : null;

    const bathroomMatch = html.match(/(\d+)\s*(?:Baño|Ba[ñn]o)/i);
    data.bathrooms = bathroomMatch ? parseInt(bathroomMatch[1]) : null;

    // ── Antiquity ──
    const antiquityMatch = html.match(/Antigüedad\s*(\d+)\s*años/i);
    data.year_built = antiquityMatch ? (new Date().getFullYear() - parseInt(antiquityMatch[1])) : null;

    // ── Images ──
    data.images = [];
    // Strategy 1: Unite Gallery images (main gallery)
    const gallerySection = html.match(/<div[^>]*id=["']gallery-1["'][^>]*>([\s\S]*?)<\/div>/i);
    if (gallerySection) {
        const imgRegex = /src=["']([^"']+uploads[^"']+)["']/g;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(gallerySection[1])) !== null) {
            const url = imgMatch[1].startsWith('http') ? imgMatch[1] : `${BASE_DOMAIN}${imgMatch[1]}`;
            if (!data.images.includes(url)) data.images.push(url);
        }
    }

    // Strategy 2: Any image with /uploads/ path (broader catch)
    if (data.images.length === 0) {
        const allImgRegex = /(?:src|data-src|data-image|data-large)=["']((?:https?:)?\/\/[^"']*uploads[^"']+)["']/g;
        let imgMatch;
        while ((imgMatch = allImgRegex.exec(html)) !== null) {
            let url = imgMatch[1];
            if (url.startsWith('//')) url = 'https:' + url;
            if (!data.images.includes(url)) data.images.push(url);
        }
    }

    // Strategy 3: Look for img tags with tucumanpropiedades domain
    if (data.images.length === 0) {
        const domainImgRegex = /src=["'](https?:\/\/tucumanpropiedades\.com\.ar\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi;
        let imgMatch;
        while ((imgMatch = domainImgRegex.exec(html)) !== null) {
            const url = imgMatch[1];
            if (!url.includes('logo') && !url.includes('favicon') && !data.images.includes(url)) {
                data.images.push(url);
            }
        }
    }

    // ── Expenses ──
    const expensasMatch = html.match(/[Ee]xpensas[:\s]*\$?\s*([\d.,]+)/i);
    data.expenses = expensasMatch ? parseFloat(expensasMatch[1].replace(/\./g, '').replace(',', '.')) : null;

    return data;
}

// ── Main ────────────────────────────────────────────────────
async function main() {
    const baseUrl = process.argv[2] || DEFAULT_URL;
    const maxPagesOverride = process.argv[3] ? parseInt(process.argv[3]) : null;

    log('🏠 Scraper de Propiedades Inmobiliarias');
    log(`📍 URL base: ${baseUrl}`);
    log('');

    // Step 1: Fetch first page to detect pagination
    log('📄 Obteniendo primera página...');
    const firstPageHtml = await fetchHTML(baseUrl);
    if (!firstPageHtml) {
        log('❌ No se pudo obtener la primera página');
        process.exit(1);
    }

    const totalPages = maxPagesOverride || detectTotalPages(firstPageHtml);
    log(`📑 Total de páginas detectadas: ${totalPages}`);

    // Step 2: Collect all property slugs from all pages
    const allSlugs = new Set();
    const firstPageSlugs = extractPropertyLinks(firstPageHtml);
    firstPageSlugs.forEach(s => allSlugs.add(s));
    log(`  Página 1: ${firstPageSlugs.length} propiedades encontradas`);

    for (let page = 2; page <= totalPages; page++) {
        await sleep(DELAY_MS);
        const pageUrl = baseUrl.includes('?')
            ? `${baseUrl}&page=${page}`
            : `${baseUrl}?page=${page}`;
        log(`📄 Obteniendo página ${page}/${totalPages}...`);
        const pageHtml = await fetchHTML(pageUrl);
        if (pageHtml) {
            const slugs = extractPropertyLinks(pageHtml);
            slugs.forEach(s => allSlugs.add(s));
            log(`  Página ${page}: ${slugs.length} propiedades encontradas`);
        }
    }

    const slugList = Array.from(allSlugs);
    log('');
    log(`🔗 Total de propiedades únicas encontradas: ${slugList.length}`);
    log('');

    // Step 3: Scrape each property detail
    const properties = [];
    let success = 0;
    let errors = 0;

    for (let i = 0; i < slugList.length; i++) {
        const slug = slugList[i];
        const url = `${BASE_DOMAIN}/ad/${slug}`;
        log(`🏡 [${i + 1}/${slugList.length}] Scrapeando: ${slug}`);

        await sleep(DELAY_MS);
        const html = await fetchHTML(url);
        if (!html) {
            log(`  ❌ Error al obtener ${url}`);
            errors++;
            continue;
        }

        try {
            const data = parsePropertyDetail(html, slug);
            properties.push(data);
            const priceStr = data.price
                ? `${data.currency} ${data.price.toLocaleString()}`
                : 'Consultar';
            log(`  ✅ ${data.title || slug} | ${priceStr} | ${data.images.length} imágenes`);
            success++;
        } catch (err) {
            log(`  ❌ Error parseando ${slug}: ${err.message}`);
            errors++;
        }
    }

    // Step 4: Save results
    log('');
    log('━'.repeat(50));
    log(`✅ Éxito: ${success} | ❌ Errores: ${errors}`);
    log(`📁 Guardando en: ${OUTPUT_FILE}`);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(properties, null, 2), 'utf-8');

    log('');
    log('🎉 ¡Scraping completado!');
    log('');

    // Summary table
    log('📊 Resumen:');
    properties.forEach((p, i) => {
        const price = p.price ? `${p.currency} ${p.price.toLocaleString()}` : 'Consultar';
        log(`  ${i + 1}. ${(p.title || 'Sin título').substring(0, 40)} | ${price} | 📷 ${p.images.length}`);
    });
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
