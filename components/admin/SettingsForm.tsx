"use client";

import { useTransition } from "react";
import { updateSiteSettings } from "@/app/admin/actions";
import { Database } from "@/lib/database.types";
import { Save, Loader2 } from "lucide-react";

type SiteSettings = Database['public']['Tables']['site_settings']['Row'];

export function SettingsForm({ settings }: { settings: SiteSettings }) {
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            await updateSiteSettings(formData);
            alert("✅ Ajustes guardados correctamente. Los cambios ya están en vivo.");
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-card border border-border rounded-3xl p-8 max-w-3xl">

            <section className="space-y-4">
                <h3 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
                    Textos de Inicio (Hero)
                </h3>

                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Título Principal</label>
                    <input
                        name="hero_title"
                        defaultValue={settings.hero_title}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-balance">Usa &lt;br/&gt; para saltos de línea estéticos si es necesario.</p>
                </div>

                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Subtítulo</label>
                    <textarea
                        name="hero_subtitle"
                        defaultValue={settings.hero_subtitle}
                        rows={3}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none resize-none"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Imagen de Fondo (URL)</label>
                    <input
                        name="hero_image_url"
                        defaultValue={settings.hero_image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-balance">Pega el enlace a la imagen que quieras usar de portada principal.</p>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
                    Estilos y Colores
                </h3>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Color Primario (Marca)</label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="color"
                                name="primary_color"
                                defaultValue={settings.primary_color}
                                className="w-12 h-12 rounded-xl cursor-pointer border border-border"
                            />
                            <div className="text-sm font-medium text-muted-foreground bg-muted px-4 py-2 rounded-lg border border-border">
                                {settings.primary_color}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Color de Acento (Destacados)</label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="color"
                                name="accent_color"
                                defaultValue={settings.accent_color}
                                className="w-12 h-12 rounded-xl cursor-pointer border border-border"
                            />
                            <div className="text-sm font-medium text-muted-foreground bg-muted px-4 py-2 rounded-lg border border-border">
                                {settings.accent_color}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Tipografía para Títulos</label>
                        <select
                            name="font_heading"
                            defaultValue={settings.font_heading}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none cursor-pointer"
                        >
                            <option value="var(--font-heading)">Playfair Display (Clásica y Elegante)</option>
                            <option value="var(--font-sans)">Inter (Moderna y Neutra)</option>
                            <option value="var(--font-brand)">Outfit (Geométrica e Innovadora)</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Estilo de Tarjeta de Propiedad</label>
                        <select
                            name="property_card_style"
                            defaultValue={settings.property_card_style}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none cursor-pointer"
                        >
                            <option value="modern">Moderna (Redondeada, Efecto Cristal)</option>
                            <option value="classic">Clásica (Bordes Rectos, Elegante)</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-2">Afecta cómo se ven las propiedades en el catálogo y la home.</p>
                    </div>
                </div>

            </section>

            <div className="pt-6 mt-8 flex justify-end">
                <button type="submit" disabled={isPending} className="px-8 py-3 bg-brand text-white rounded-full font-medium hover:bg-gold hover:text-black transition-colors flex items-center gap-2">
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Guardar Cambios
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
