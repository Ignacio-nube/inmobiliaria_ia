import { createClient } from '@/lib/supabase/server';
import { HomeContent } from '@/components/home/HomeContent';

// This is a Next.js Server Component that runs on the server.
// It fetches initial data from Supabase with zero client JS bundle cost.
export default async function HomePage() {
  const supabase = await createClient();

  // Fetch featured properties directly from the DB Server-Side
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .eq('published', true)
    .eq('is_featured', true)
    .limit(3);

  if (propertiesError) {
    console.error("Error fetching properties:", propertiesError);
  }

  // Fetch dynamic CMS settings
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('hero_title, hero_subtitle, property_card_style, hero_image_url')
    .limit(1)
    .single();

  if (settingsError && settingsError.code !== 'PGRST116') {
    console.error("Error fetching site settings:", settingsError);
  }

  const heroTitle = settings?.hero_title || "Encontrá tu lugar en el mundo";
  const heroSubtitle = settings?.hero_subtitle || "La primera inmobiliaria en Tucumán potenciada por Inteligencia Artificial. Escribí lo que buscás, nosotros encontramos tu hogar ideal.";
  const cardStyle = settings?.property_card_style || "modern";
  const heroImgUrl = settings?.hero_image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop";

  return (
    <HomeContent
      properties={properties || []}
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle}
      cardStyle={cardStyle}
      heroImgUrl={heroImgUrl}
    />
  );
}
