"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface ScrapedProperty {
    title: string | null;
    price: number | null;
    currency: string | null;
    operation_type: string | null;
    property_type: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    square_meters: number | null;
    description: string | null;
    amenities: string[];
    bedrooms: number | null;
    bathrooms: number | null;
    year_built: number | null;
    images: string[];
    expenses: number | null;
    source_url: string;
    property_code: string | null;
}

export async function importScrapedProperties(properties: ScrapedProperty[]) {
    const supabase = await createClient();
    const results = { imported: 0, errors: 0, details: [] as string[] };

    for (const prop of properties) {
        const record = {
            title: prop.title || "Sin título",
            description: prop.description || "",
            price: prop.price || 0,
            currency: prop.currency === 'consultar' ? 'USD' : (prop.currency || 'USD'),
            location: [prop.city, prop.province].filter(Boolean).join(', ') || 'Tucumán',
            property_type: prop.property_type || 'Casa',
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            square_meters: prop.square_meters,
            images: prop.images || [],
            published: false,
            is_featured: false,
            approval_status: 'pending' as const,
            address: prop.address,
            city: prop.city || 'San Miguel de Tucumán',
            province: prop.province || 'Tucumán',
            operation_type: prop.operation_type || 'venta',
            year_built: prop.year_built,
            garage: 0,
            amenities: prop.amenities || [],
            lot_meters: null,
            condition: 'bueno' as const,
            expenses: prop.expenses,
        };

        const { error } = await supabase.from("properties").insert(record);

        if (error) {
            results.errors++;
            results.details.push(`❌ ${prop.title}: ${error.message}`);
        } else {
            results.imported++;
            results.details.push(`✅ ${prop.title}`);
        }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/propiedades");
    revalidatePath("/propiedades");
    revalidatePath("/");

    return results;
}
