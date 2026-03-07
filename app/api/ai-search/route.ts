import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CITIES } from '@/lib/locations';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_PARAMS = {
    searchTerm: '',
    propertyType: 'all',
    minBedrooms: 'any',
    minBathrooms: 'any',
    minGarage: 'any',
    minArea: '',
    maxArea: '',
    condition: 'all',
    amenities: [],
    precioMin: null,
    precioMax: null,
    moneda: null,
    operationType: 'all',
    city: '',
    neighborhood: '',
};

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                ...DEFAULT_PARAMS,
                searchTerm: query,
            });
        }

        const prompt = `
Sos un asistente inmobiliario en Tucumán, Argentina. 
Analizá esta búsqueda del usuario: "${query}"

IMPORTANTE SOBRE BÚSQUEDAS:
- Los usuarios suelen escribir con errores ortográficos, sin tildes, o de forma coloquial (ej: "yerva wena" -> "Yerba Buena", "picina" -> "pileta", "caza" -> "Casa").
- Intentá interpretar correctamente lo que buscan. Si mencionan algo específico que no es un tipo de propiedad estándar (ej: "departamento con asador y picina"), extraé "asador pileta" como searchTerm.
- Las ciudades permitidas son: ${CITIES.join(', ')}. Si el usuario menciona alguna variante coloquial (ej: "talitas", "centro", "san miguel"), mapealos a la ciudad oficial correcta ("Las Talitas", "San Miguel de Tucumán", etc.).

Extraé los siguientes parámetros en formato JSON estricto:
- "searchTerm": Texto clave libre. Usalo SIEMPRE para cosas que no encajen en filtros (ej: "lujoso", "amoblado", "excelente estado"). Si todo el texto es un filtro, string vacío "". Corrige errores ortográficos si los detectas.
- "propertyType": Solo uno de: "all", "Casa", "Departamento", "Terreno", "Local", "Oficina", "Duplex". Si no se especifica, "all".
- "minBedrooms": Mínimo de habitaciones/dormitorios (ej: "2"). Si no se especifica, "any".
- "minBathrooms": Mínimo de baños (ej: "2"). Si no se especifica, "any".
- "minGarage": Mínimo de cocheras/autos (ej: "1"). Si no se especifica, "any".
- "minArea": Mínimo de metros cuadrados (ej: "100" si dice "mas de 100m"). Si no se especifica, "".
- "maxArea": Máximo de metros cuadrados (ej: "200" si dice "hasta 200m2"). Si no se especifica, "".
- "condition": Estado de la propiedad. Mapear a: "nuevo" (a estrenar, nuevo), "bueno" (excelente, reciclado), o "a_refaccionar" (para refaccionar, destruir). Si no se especifica, "all".
- "amenities": Array de strings con amenidades seleccionables. Opciones válidas: "pileta", "quincho", "parrilla", "seguridad", "ascensor", "jardin", "cochera_cubierta", "vestidor", "deposito", "vidriera", "alta_visibilidad", "vista_panoramica", "servicios_completos", "lavadero", "terraza", "calefaccion". Si piden "piscina" -> "pileta", si piden "asador" -> "parrilla". Si no hay amenidades, array vacío [].
- "precioMin": Número o null. Extraer el mínimo de precio mencionado. Si dicen "desde 50000" -> 50000. Si no se menciona precio, null.
- "precioMax": Número o null. Extraer el máximo de precio mencionado. Si dicen "hasta 100000" o "menos de 100000" -> 100000. Si dicen "1 millón" o "un millón" -> 1000000. Si no se menciona precio, null.
- "moneda": "ARS" | "USD" | null. Si el usuario dice "pesos", "millón de pesos", "$" sin aclarar -> "ARS". Si dice "dólares", "USD", "dolares", "usd", "verdes", "U$S" -> "USD". Si no especifica moneda, null (buscar en ambas).
- "operationType": Solo uno de: "all", "venta", "alquiler", "alquiler_temporal". Si no se especifica, "all".
- "city": Nombre exacto de la ciudad de la lista permitida. Si dicen "centro", usar "San Miguel de Tucumán". Si no se indica, "".
- "neighborhood": Nombre del barrio si se menciona (ej: "Barrio Norte"). Si no, "".

IMPORTANTE: Devolvé ÚNICAMENTE un JSON válido, sin delimitadores \`\`\`json ni texto adicional.
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a specialized real estate API that returns only strictly parseable JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0,
        });

        const responseContent = response.choices[0].message.content?.trim() || "{}";
        const jsonStr = responseContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        let parsedParams;
        try {
            parsedParams = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse OpenAI response", responseContent);
            parsedParams = {
                ...DEFAULT_PARAMS,
                searchTerm: query,
            };
        }

        return NextResponse.json(parsedParams);
    } catch (error: any) {
        console.error('AI Search Error:', error);
        return NextResponse.json({ error: 'Failed to process AI search' }, { status: 500 });
    }
}
