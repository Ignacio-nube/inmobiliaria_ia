"use client";

import { useTransition, useState } from "react";
import { updateSiteSettings } from "@/app/admin/actions";
import { Database } from "@/lib/database.types";
import { Save, Loader2, Type, Palette, Layout, CheckCircle, Phone, Mail, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import { useRouter } from "next/navigation";

type SiteSettings = Database['public']['Tables']['site_settings']['Row'];

export function SettingsForm({ settings }: { settings: SiteSettings }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [primaryColor, setPrimaryColor] = useState(settings.primary_color || "#1e3a8a");
    const [accentColor, setAccentColor] = useState(settings.accent_color || "#d4af37");
    const [saved, setSaved] = useState(false);

    const PALETTE_PRESETS = [
        { name: "Navy & Gold", primary: "#1e3a8a", accent: "#d4af37", vibe: "Lujo · Corporativo" },
        { name: "Teal & Amber", primary: "#0d9488", accent: "#f59e0b", vibe: "Moderno · Cálido" },
        { name: "Slate & Rose", primary: "#0f172a", accent: "#f43f5e", vibe: "Editorial · Audaz" },
        { name: "Violet & Lime", primary: "#7c3aed", accent: "#84cc16", vibe: "Creativo · Tech" },
        { name: "Forest & Peach", primary: "#166534", accent: "#fb923c", vibe: "Natural · Orgánico" },
        { name: "Crimson & Ivory", primary: "#be123c", accent: "#fef3c7", vibe: "Elegante · Clásico" },
    ];

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            await updateSiteSettings(formData);
            router.refresh();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">

            {/* Hero Texts */}
            <Section icon={<Type className="w-5 h-5" />} title="Textos de Inicio (Hero)">
                <div>
                    <Label>Título Principal</Label>
                    <input
                        name="hero_title"
                        defaultValue={settings.hero_title}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40 outline-none"
                    />
                    <Hint>Usa &lt;br/&gt; para saltos de línea estéticos si es necesario.</Hint>
                </div>

                <div>
                    <Label>Subtítulo</Label>
                    <textarea
                        name="hero_subtitle"
                        defaultValue={settings.hero_subtitle}
                        rows={3}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40 outline-none resize-none"
                    />
                </div>

                <div>
                    <Label>URLs de Imágenes del Carrusel</Label>
                    <textarea
                        name="hero_image_url"
                        defaultValue={settings.hero_image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"}
                        rows={2}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40 outline-none resize-y font-mono"
                        placeholder={"https://imagen1.jpg\nhttps://imagen2.jpg\nhttps://imagen3.jpg"}
                    />
                    <Hint>Pegá una URL por línea. Todas las imágenes rotan automáticamente en el carrusel de la home.</Hint>
                </div>

                <div>
                    <Label>Subir Imagen desde el equipo</Label>
                    <input
                        type="file"
                        name="hero_image_file"
                        accept="image/*"
                        className="w-full mt-2 text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer bg-slate-800/50 border border-slate-700/50 rounded-xl transition-all"
                    />
                    <Hint>Si subís un archivo, este sobreescribirá las URLs especificadas arriba.</Hint>
                </div>
            </Section>

            {/* Colors */}
            <Section icon={<Palette className="w-5 h-5" />} title="Colores de Marca">
                <input type="hidden" name="primary_color" value={primaryColor} />
                <input type="hidden" name="accent_color" value={accentColor} />

                <div className="space-y-3">
                    <Label>Paletas Predefinidas</Label>
                    <Hint>Aplicá primario y acento con un solo clic.</Hint>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {PALETTE_PRESETS.map((palette) => {
                            const isActive = primaryColor === palette.primary && accentColor === palette.accent;
                            return (
                                <button
                                    key={palette.name}
                                    type="button"
                                    onClick={() => { setPrimaryColor(palette.primary); setAccentColor(palette.accent); }}
                                    className={`group relative p-3 rounded-2xl border-2 transition-all text-left hover:scale-[1.02] ${isActive
                                        ? "border-blue-500 shadow-lg shadow-blue-500/10 bg-slate-800/50"
                                        : "border-slate-700/50 hover:border-blue-500/50 bg-slate-800/20"
                                        }`}
                                >
                                    <div className="flex gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-xl shadow-sm flex-shrink-0" style={{ backgroundColor: palette.primary }} />
                                        <div className="w-8 h-8 rounded-xl shadow-sm flex-shrink-0" style={{ backgroundColor: palette.accent }} />
                                        {isActive && (
                                            <span className="ml-auto text-blue-400 text-xs font-bold flex items-center">
                                                <CheckCircle className="w-4 h-4" />
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-semibold text-white leading-tight">{palette.name}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{palette.vibe}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3">
                        <Label>Color Primario (Marca)</Label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-12 h-12 rounded-xl cursor-pointer border border-slate-700/50 bg-transparent"
                            />
                            <div className="text-sm font-mono font-medium text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
                                {primaryColor}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Color de Acento (Destacados)</Label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="color"
                                value={accentColor}
                                onChange={(e) => setAccentColor(e.target.value)}
                                className="w-12 h-12 rounded-xl cursor-pointer border border-slate-700/50 bg-transparent"
                            />
                            <div className="text-sm font-mono font-medium text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
                                {accentColor}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Preview */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Vista Previa</p>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-12 rounded-xl flex items-center justify-center text-sm font-semibold text-white" style={{ backgroundColor: primaryColor }}>
                            Botón Primario
                        </div>
                        <div className="flex-1 h-12 rounded-xl flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: accentColor, color: '#000' }}>
                            Botón Acento
                        </div>
                        <div className="flex-1 h-12 rounded-xl border-2 flex items-center justify-center text-sm font-semibold" style={{ borderColor: primaryColor, color: primaryColor }}>
                            Outline
                        </div>
                    </div>
                </div>
            </Section>

            {/* Typography & Card Style */}
            <Section icon={<Layout className="w-5 h-5" />} title="Tipografía y Estilo">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>Tipografía para Títulos</Label>
                        <select
                            name="font_heading"
                            defaultValue={settings.font_heading || '"Playfair Display", ui-serif, Georgia, serif'}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none cursor-pointer"
                        >
                            <option value={'"Playfair Display", ui-serif, Georgia, serif'}>Playfair Display (Clásica y Elegante)</option>
                            <option value={'"Inter", ui-sans-serif, system-ui, sans-serif'}>Inter (Moderna y Neutra)</option>
                            <option value={'"Outfit", ui-sans-serif, system-ui, sans-serif'}>Outfit (Geométrica e Innovadora)</option>
                        </select>
                    </div>

                    <div>
                        <Label>Estilo de Tarjeta de Propiedad</Label>
                        <select
                            name="property_card_style"
                            defaultValue={settings.property_card_style}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none cursor-pointer"
                        >
                            <option value="modern">Moderna (Redondeada, Efecto Cristal)</option>
                            <option value="classic">Clásica (Bordes Rectos, Elegante)</option>
                        </select>
                        <Hint>Afecta cómo se ven las propiedades en el catálogo y la home.</Hint>
                    </div>
                </div>
            </Section>

            {/* Contact Info */}
            <Section icon={<Phone className="w-5 h-5" />} title="Información de Contacto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input
                                name="contact_email"
                                defaultValue={settings.contact_email || ""}
                                placeholder="contacto@inmobiliaria.com"
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Teléfono / WhatsApp</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input
                                name="contact_phone"
                                defaultValue={settings.contact_phone || ""}
                                placeholder="+54 9 381 XXXXXXX"
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <Label>Dirección Física</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input
                                name="contact_address"
                                defaultValue={settings.contact_address || ""}
                                placeholder="Av. Aconquija 1234, Yerba Buena, Tucumán"
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                            />
                        </div>
                        <Hint>Si dejas estos campos en blanco, se ocultarán del pie de página automáticamente.</Hint>
                    </div>
                </div>
            </Section>

            {/* Social Media */}
            <Section icon={<Instagram className="w-5 h-5" />} title="Redes Sociales">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>URL de Instagram</Label>
                        <div className="relative">
                            <Instagram className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input
                                name="social_instagram"
                                defaultValue={settings.social_instagram || ""}
                                placeholder="https://instagram.com/tuinmobiliaria"
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <Label>URL de Facebook</Label>
                        <div className="relative">
                            <Facebook className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input
                                name="social_facebook"
                                defaultValue={settings.social_facebook || ""}
                                placeholder="https://facebook.com/tuinmobiliaria"
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <Label>URL de Twitter / X</Label>
                        <div className="relative">
                            <Twitter className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input
                                name="social_twitter"
                                defaultValue={settings.social_twitter || ""}
                                placeholder="https://twitter.com/tuinmobiliaria"
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/40 outline-none"
                            />
                        </div>
                        <Hint>Al igual que el contacto, las redes vacías no mostrarán el ícono en la web.</Hint>
                    </div>
                </div>
            </Section>

            {/* Save Button */}
            <div className="pt-4 flex items-center gap-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 min-w-[200px] disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isPending ? "Guardando..." : "Guardar Cambios"}</span>
                </button>

                {saved && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium animate-pulse">
                        <CheckCircle className="w-4 h-4" />
                        ¡Cambios guardados!
                    </div>
                )}
            </div>
        </form>
    );
}

// Reusable sub-components
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <section className="bg-slate-800/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 pb-3 border-b border-slate-700/50">
                <span className="text-blue-400">{icon}</span>
                {title}
            </h3>
            {children}
        </section>
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return <label className="text-sm font-medium text-slate-300 mb-1 block">{children}</label>;
}

function Hint({ children }: { children: React.ReactNode }) {
    return <p className="text-xs text-slate-500 mt-1">{children}</p>;
}
