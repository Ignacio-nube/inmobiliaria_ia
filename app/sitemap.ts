import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://ignacio.cloud'; // In a real app this would use an ENV var

    // Static routes
    const routes = [
        '',
        '/propiedades',
        '/publicar',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    try {
        const supabase = await createClient();
        // Fetch properties to dynamically generate sitemap URLs
        const { data: properties } = await supabase
            .from('properties')
            .select('id, created_at')
            .eq('published', true);

        if (properties) {
            const propertyRoutes = properties.map((property) => ({
                url: `${baseUrl}/propiedades/${property.id}`,
                lastModified: new Date(property.created_at || new Date()),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            }));

            return [...routes, ...propertyRoutes];
        }
    } catch (error) {
        console.error("Error generating sitemap", error);
    }

    return routes;
}
