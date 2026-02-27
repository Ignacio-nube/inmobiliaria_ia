import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { messages, property } = await req.json();

        if (!messages || !property) {
            return NextResponse.json({ error: 'messages and property required' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                reply: "Lo siento, el chat no está disponible en este momento. Por favor, contactanos por WhatsApp o el formulario de contacto."
            });
        }

        const systemPrompt = `Eres un asistente inmobiliario amable y profesional de "Ignacio Propiedades" en Tucumán, Argentina.
Estás respondiendo preguntas sobre la siguiente propiedad:

**${property.title}**
- Tipo: ${property.property_type} en ${property.operation_type}
- Ubicación: ${property.location}${property.neighborhood ? `, barrio ${property.neighborhood}` : ''}${property.address ? `, ${property.address}` : ''}
- Ciudad: ${property.city}, ${property.province}
- Precio: ${property.currency} ${property.price?.toLocaleString()}${property.expenses ? ` (Expensas: $${property.expenses.toLocaleString()}/mes)` : ''}
- Dormitorios: ${property.bedrooms || 'No especificado'}
- Baños: ${property.bathrooms || 'No especificado'}
- Superficie cubierta: ${property.square_meters ? `${property.square_meters} m²` : 'No especificada'}${property.lot_meters ? `\n- Superficie terreno: ${property.lot_meters} m²` : ''}
- Cocheras: ${property.garage || 0}
- Estado: ${property.condition === 'nuevo' ? 'A estrenar' : property.condition === 'bueno' ? 'Buen estado' : 'A refaccionar'}${property.year_built ? `\n- Año construcción: ${property.year_built}` : ''}${property.amenities?.length > 0 ? `\n- Amenidades: ${property.amenities.join(', ')}` : ''}

Descripción: ${property.description}

REGLAS:
- Responde SOLO sobre esta propiedad específica
- Sé conciso (máximo 3-4 oraciones)
- Usa español argentino ("vos", "podés", etc.)
- Si no sabés algo, sugerí contactar al agente
- No inventes información que no esté en los datos`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.slice(-6), // Last 6 messages for context
            ],
            temperature: 0.7,
            max_tokens: 300,
        });

        const reply = response.choices[0].message.content || "No pude procesar tu pregunta. Intentá de nuevo.";

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('Property Chat Error:', error);
        return NextResponse.json({
            reply: "Ocurrió un error. Por favor, intentá de nuevo o contactanos directamente."
        }, { status: 500 });
    }
}
