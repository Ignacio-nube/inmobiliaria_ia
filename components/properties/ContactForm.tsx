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
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                <h4 className="font-semibold text-lg">¡Mensaje Enviado!</h4>
                <p className="text-sm">La inmobiliaria se pondrá en contacto a la brevedad.</p>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-sm font-medium text-green-700 underline mt-2"
                >
                    Enviar otro mensaje
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
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
                className="w-full py-3 bg-brand text-white rounded-xl font-medium hover:bg-gold hover:text-black transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Solicitar Visita</span>
            </button>
        </form>
    );
}
