import { createClient } from '@/lib/supabase/server';
import { HomeContent } from '@/components/home/HomeContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://ignacio.cloud',
  }
};

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
    .limit(9);


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

  // Parse hero images: support newline-separated and comma-separated URLs
  const rawHeroUrls = settings?.hero_image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop";
  const heroImages = rawHeroUrls
    .split(/[\n,]/)
    .map((url: string) => url.trim())
    .filter((url: string) => url.length > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Ignacio Propiedades",
    "image": heroImages[0],
    "url": "https://ignacio.cloud",
    // We try to grab the settings phone/address or use defaults
    "telephone": (settings as any)?.contact_phone || "+5493815550192",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": (settings as any)?.contact_address || "Tucumán, Argentina",
      "addressLocality": "Tucumán",
      "addressCountry": "AR"
    },
    "description": heroSubtitle
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent
        properties={properties || []}
        heroTitle={heroTitle}
        heroSubtitle={heroSubtitle}
        cardStyle={cardStyle}
        heroImages={heroImages}
      />
    </>
  );
}
