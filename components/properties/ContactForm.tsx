"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2 } from "lucide-react";

interface ContactFormProps {
    propertyId: string;
    propertyTitle: string;
}

export function ContactForm({ propertyId, propertyTitle }: ContactFormProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        message: `Hola, me interesa la propiedad "${propertyTitle}". Quisiera recibir más información.`
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const { error } = await supabase.from('contacts').insert({
                property_id: propertyId || null,
                property_title: propertyTitle || null,
                name: formData.name,
                phone: formData.phone,
                message: formData.message
            });

            if (error) {
                console.error(error);
                setErrorMsg(error.message);
                return;
            }

            setSuccess(true);
            setFormData({ name: "", phone: "", message: "" });
        } catch (err: any) {
            setErrorMsg("Error interno al enviar el mensaje.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-green-100/50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-800 dark:text-green-500 rounded-xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                <h4 className="font-semibold text-lg">¡Mensaje Enviado!</h4>
                <p className="text-sm text-green-700 dark:text-green-400">La inmobiliaria se pondrá en contacto a la brevedad.</p>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-sm font-medium underline mt-2 hover:opacity-80 transition-opacity"
                >
                    Enviar otro mensaje
                </button>
            </div>
        );
    }

    return (
        <form id="tour-contact-form" onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">
                    {errorMsg}
                </div>
            )}

            <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Tu Nombre</label>
                <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    type="text"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none transition-all"
                    placeholder="Juan Pérez"
                />
            </div>
            <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Teléfono / WhatsApp</label>
                <input
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    type="tel"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none transition-all"
                    placeholder="+54 381..."
                />
            </div>
            <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Mensaje</label>
                <textarea
                    required
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none resize-none transition-all"
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="relative overflow-hidden w-full py-3.5 bg-gradient-to-r from-brand to-brand/80 text-white rounded-xl font-medium shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_25px_rgba(brand,0.4)] transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
            >
                {/* Premium pulse glow effect in the background */}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <div className="absolute inset-0 rounded-xl ring-2 ring-white/10 ring-offset-2 ring-offset-background group-hover:ring-brand/50 transition-all duration-300" />

                <div className="relative z-10 flex items-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Enviar Consulta</span>
                </div>
            </button>
        </form>
    );
}
