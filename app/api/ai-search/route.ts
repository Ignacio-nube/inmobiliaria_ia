import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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
            // Fallback if no API key is provided, just return a simple text search
            return NextResponse.json({
                searchTerm: query,
                propertyType: 'all',
                minBedrooms: 'any',
                priceRange: 'all'
            });
        }

        const prompt = `
      Eres un asistente inmobiliario especializado en Tucumán. 
      Analiza la siguiente búsqueda de un usuario: "${query}"

      Extrae los siguientes parámetros de búsqueda y devuélvelos en formato JSON estricto:
      - "searchTerm": Texto libre (ej. el nombre del barrio, amenities como "pileta"). Si no hay, string vacío "".
      - "propertyType": Sólo puede ser uno de estos valores exactos: "all", "Casa", "Departamento", "Terreno", "Local", "Oficina", "Duplex". Si no se especifica, "all".
      - "minBedrooms": El mínimo de habitaciones busadas (ej. "2"). Si no se especifica, "any".
      - "priceRange": Rango de precio. Sólo puede ser: "all", "under100k" (Menos de 100k USD), "100k-250k" (Entre 100k y 250k USD), "over250k" (Más de 250k USD). Si no se especifica, "all".

      IMPORTANTE: Devuelve ÚNICAMENTE un JSON válido, sin delimitadores \`\`\`json ni texto adicional.
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

        // Strip possible markdown formatting if the model still returns it
        const jsonStr = responseContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        let parsedParams;
        try {
            parsedParams = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse OpenAI response", responseContent);
            // Fallback
            parsedParams = { searchTerm: query, propertyType: 'all', minBedrooms: 'any', priceRange: 'all' };
        }

        return NextResponse.json(parsedParams);
    } catch (error: any) {
        console.error('AI Search Error:', error);
        return NextResponse.json({ error: 'Failed to process AI search' }, { status: 500 });
    }
}
