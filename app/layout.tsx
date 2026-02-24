import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-brand" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  metadataBase: new URL("https://ignacio.cloud"),
  title: {
    default: "Ignacio Propiedades | Inmobiliaria Moderna en Tucumán",
    template: "%s | Ignacio Propiedades"
  },
  description: "Encuentra tu próximo hogar en Tucumán. Casas, departamentos y terrenos con búsqueda impulsada por IA. La forma más inteligente de buscar propiedades.",
  keywords: ["inmobiliaria", "tucumán", "propiedades", "casas tucumán", "departamentos", "yerba buena", "venta", "alquiler"],
  authors: [{ name: "Ignacio" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://ignacio.cloud",
    title: "Ignacio Propiedades",
    description: "Inmobiliaria moderna impulsada por Inteligencia Artificial en Tucumán.",
    siteName: "Ignacio Propiedades",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ignacio Propiedades",
    description: "Inmobiliaria de próxima generación.",
  }
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

import { createClient } from "@/lib/supabase/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("primary_color, accent_color, font_heading")
    .limit(1)
    .single();

  const primaryColor = settings?.primary_color || "#1e3a8a";
  const accentColor = settings?.accent_color || "#d4af37";

  // Decide which font CSS variable to use for headings
  // E.g., if set to 'var(--font-playfair)' it uses the Playfair Display we imported
  const fontHeadingVar = settings?.font_heading || "var(--font-heading)";

  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${inter.variable} ${outfit.variable} ${playfair.variable} font-sans antialiased min-h-screen flex flex-col`}
        style={{
          "--color-brand": primaryColor,
          "--color-gold": accentColor,
          "--font-heading": fontHeadingVar,
        } as React.CSSProperties}
      >
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
