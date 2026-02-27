import { createClient } from '@/lib/supabase/server';
import { PropertiesClient } from '@/components/properties/PropertiesClient';
import { Suspense } from 'react';

export const metadata = {
    title: 'Todas las Propiedades',
    description: 'Explora nuestro catálogo completo de propiedades en Tucumán. Casas, departamentos, duplex y terrenos en venta y alquiler.',
};

export default async function PropertiesPage() {
    const supabase = await createClient();

    // Fetch all published properties
    const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('published', true)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

    if (propertiesError) {
        console.error("Error fetching properties:", propertiesError);
    }

    // Fetch dynamic CMS settings
    const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('property_card_style')
        .limit(1)
        .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
        console.error("Error fetching site settings:", settingsError);
    }

    const cardStyle = settings?.property_card_style || "modern";

    return (
        <div className="min-h-screen bg-background pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-4">
                        Catálogo de Propiedades
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Encuentra la propiedad que estás buscando utilizando nuestros filtros avanzados.
                    </p>
                </div>

                <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Cargando propiedades...</div>}>
                    <PropertiesClient
                        initialProperties={properties || []}
                        cardStyle={cardStyle}
                    />
                </Suspense>
            </div>
        </div>
    );
}
