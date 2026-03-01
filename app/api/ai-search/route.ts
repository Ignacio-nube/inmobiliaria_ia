import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CITIES } from '@/lib/locations';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                searchTerm: query,
                propertyType: 'all',
                minBedrooms: 'any',
                priceRange: 'all',
                operationType: 'all',
                city: '',
                neighborhood: '',
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
- "searchTerm": Texto libre clave para buscar en títulos, descripciones o amenidades (ej: "pileta", "vista", "asador", "jardin"). Si no hay, string vacío "". Corrige errores ortográficos si los detectas.
- "propertyType": Solo uno de: "all", "Casa", "Departamento", "Terreno", "Local", "Oficina", "Duplex". Si no se especifica explícitamente, "all".
- "minBedrooms": Mínimo de habitaciones (ej: "2"). Si no se especifica, "any".
- "priceRange": Solo uno de: "all", "under50k", "50k-100k", "100k-250k", "over250k". Si no se especifica, "all".
- "operationType": Solo uno de: "all", "venta", "alquiler", "alquiler_temporal". Si no se especifica, "all".
- "city": Nombre exacto de la ciudad si se menciona y se puede inferir de la lista de permitidas. Si dice "centro" o no es claro, pon "San Miguel de Tucumán" si el contexto parece ser la capital. Si no se puede inferir nada geográfico, string vacío "".
- "neighborhood": Nombre del barrio si se menciona (ej: "Barrio Norte", "Barrio Sur", "Cerro de las Rosas"). No confundir con la ciudad. Si no se menciona un barrio específico, "".

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
                searchTerm: query,
                propertyType: 'all',
                minBedrooms: 'any',
                priceRange: 'all',
                operationType: 'all',
                city: '',
                neighborhood: '',
            };
        }

        return NextResponse.json(parsedParams);
    } catch (error: any) {
        console.error('AI Search Error:', error);
        return NextResponse.json({ error: 'Failed to process AI search' }, { status: 500 });
    }
}
