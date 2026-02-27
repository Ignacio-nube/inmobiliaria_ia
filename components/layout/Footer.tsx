import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone } from "lucide-react";
import { Database } from "@/lib/database.types";

type SiteSettings = Partial<Database['public']['Tables']['site_settings']['Row']>;

export function Footer({ settings }: { settings?: SiteSettings }) {
    const hasContact = settings?.contact_address || settings?.contact_phone || settings?.contact_email;
    const hasSocial = settings?.social_instagram || settings?.social_facebook || settings?.social_twitter;

    return (
        <footer className="bg-[#0b1426] text-white mt-auto py-16 border-t border-border/10">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1 flex flex-col items-start">
                        <div className="bg-white/5 p-4 rounded-2xl mb-6 inline-block">
                            <Logo isDarkTheme={true} />
                        </div>
                        <p className="text-zinc-300 text-sm text-balance max-w-xs leading-relaxed">
                            La forma más inteligente de encontrar tu próximo hogar en Tucumán. Tecnología e Inteligencia Artificial al servicio inmobiliario.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-brand font-semibold mb-6 tracking-tight text-lg">Explorar</h4>
                        <ul className="space-y-4 text-sm text-zinc-300">
                            <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
                            <li><Link href="/propiedades" className="hover:text-white transition-colors">Propiedades</Link></li>
                            <li><Link href="/publicar" className="hover:text-white transition-colors">Publicar Propiedad</Link></li>
                            <li><Link href="/agencias" className="hover:text-white transition-colors">Agencias</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    {hasContact && (
                        <div>
                            <h4 className="font-brand font-semibold mb-6 tracking-tight text-lg">Contacto</h4>
                            <ul className="space-y-4 text-sm text-zinc-300">
                                {settings?.contact_address && (
                                    <li className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-brand shrink-0" />
                                        <span>{settings.contact_address}</span>
                                    </li>
                                )}
                                {settings?.contact_phone && (
                                    <li className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-brand shrink-0" />
                                        <span>{settings.contact_phone}</span>
                                    </li>
                                )}
                                {settings?.contact_email && (
                                    <li className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-brand shrink-0" />
                                        <span>{settings.contact_email}</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Social */}
                    {hasSocial && (
                        <div>
                            <h4 className="font-brand font-semibold mb-6 tracking-tight text-lg">Síguenos</h4>
                            <div className="flex items-center gap-4">
                                {settings?.social_instagram && (
                                    <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand hover:text-white transition-all">
                                        <Instagram className="w-4 h-4" />
                                    </a>
                                )}
                                {settings?.social_facebook && (
                                    <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand hover:text-white transition-all">
                                        <Facebook className="w-4 h-4" />
                                    </a>
                                )}
                                {settings?.social_twitter && (
                                    <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand hover:text-white transition-all">
                                        <Twitter className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
                    <p>© {new Date().getFullYear()} Ignacio Propiedades. Todos los derechos reservados.</p>
                    <div className="flex gap-6">
                        <Link href="/admin" className="hover:text-gold transition-colors text-white font-medium">Panel de Admin</Link>
                        <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
                        <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
