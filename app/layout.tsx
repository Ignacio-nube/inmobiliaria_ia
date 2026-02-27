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
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { DynamicTheme } from "@/components/layout/DynamicTheme";
import { generateColorShades } from "@/lib/colors";
import { TourProvider } from "@/components/tour/TourProvider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("primary_color, accent_color, font_heading, contact_address, contact_phone, contact_email, social_instagram, social_facebook, social_twitter")
    .limit(1)
    .single();

  const primaryColor = settings?.primary_color || "#1e3a8a";
  const accentColor = settings?.accent_color || "#d4af37";
  const fontHeadingFamily = settings?.font_heading || '"Playfair Display", ui-serif, Georgia, serif';

  const brandShades = generateColorShades(primaryColor, 'brand');
  const goldShades = generateColorShades(accentColor, 'gold');

  // Build CSS variable string for :root override
  const cssVars = [
    ...Object.entries(brandShades).map(([k, v]) => `${k}: ${v};`),
    ...Object.entries(goldShades).map(([k, v]) => `${k}: ${v};`),
    `--color-brand: ${primaryColor};`,
    `--color-gold: ${accentColor};`,
    // Also override the CSS variable so any direct var() references work
    `--font-heading: ${fontHeadingFamily};`,
  ].join(' ');

  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} ${playfair.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        {/*
          Blocking script: forces dark class BEFORE React hydration.
          This eliminates the flash of light theme on first load,
          regardless of OS preference. Never reads matchMedia.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('ignacio-theme');
                  var theme = stored || 'dark';
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `
          }}
        />
        <DynamicTheme cssVars={cssVars} fontHeadingFamily={fontHeadingFamily} />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="ignacio-theme">
          <TourProvider>
            <AppShell settings={settings || undefined}>
              {children}
            </AppShell>
          </TourProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
