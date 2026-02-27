import { Metadata } from 'next';
import { ContactForm } from '@/components/properties/ContactForm';
import { Mail, MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export const metadata: Metadata = {
    title: 'Contacto',
    description: 'Comunicate con Ignacio Propiedades. Estamos aquí para ayudarte a encontrar o vender tu hogar en Tucumán.',
};

export default function ContactoPage() {
    // Note: Since this is a general contact page, it's not tied to a specific property.
    // However, our ContactForm component expects propertyId and propertyTitle right now.
    // It's probably better to create a standalone version or pass null/empty strings if supported
    // For now we'll pass generic text. The DB schema supports nullable property_ids.

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Minimalist Hero */}
            <div className="relative h-[400px] w-full bg-[#0b1426] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <Image
                        src="https://images.unsplash.com/photo-1577412647305-991150c7d163?q=80&w=2070&auto=format&fit=crop"
                        alt="Oficina Ignacio Propiedades"
                        fill
                        className="object-cover opacity-40"
                    />
                </div>
                <div className="relative z-10 text-center px-4">
                    <h1 className="text-5xl md:text-7xl font-heading font-medium text-white mb-4">Contacto</h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
                        Estás a un mensaje de distancia de tu próxima mejor decisión.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-16 lg:-mt-24 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Information Cards */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
                            <h2 className="text-2xl font-bold font-heading mb-6">Nuestras Oficinas</h2>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Sede Central</h3>
                                        <p className="text-muted-foreground mt-1">Av. Aconquija 2000, Yerba Buena<br />Tucumán, Argentina</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Llamanos</h3>
                                        <p className="text-muted-foreground mt-1">+54 9 381 555-0192</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Email</h3>
                                        <p className="text-muted-foreground mt-1">hola@ignaciopropiedades.com</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Horarios</h3>
                                        <p className="text-muted-foreground mt-1">Lunes a Viernes: 9:00 - 18:00<br />Sábados: 9:00 - 13:00</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp CTA */}
                        <a
                            href="https://wa.me/5493815550192"
                            target="_blank"
                            rel="noreferrer"
                            className="bg-green-500 hover:bg-green-600 transition-colors rounded-3xl p-8 flex flex-col justify-center text-white relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.47-1.761-1.643-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01h-.008c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold mb-2 relative z-10">WhatsApp Directo</h3>
                            <p className="text-green-50 mb-6 relative z-10">Respuestas rápidas y atención personalizada al instante.</p>
                            <div className="flex items-center font-medium gap-2 relative z-10">
                                <span>Iniciar chat</span>
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </a>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-card p-8 lg:p-12 rounded-3xl border border-border shadow-xl h-full flex flex-col justify-center">
                            <h2 className="text-3xl font-bold font-heading mb-4">Envíanos tu consulta</h2>
                            <p className="text-muted-foreground mb-8">
                                Completá el formulario a la brevedad un asesor comercial de nuestra firma se pondrá en contacto para asesorarte de forma exclusiva.
                            </p>

                            <ContactForm
                                propertyId=""
                                propertyTitle="Consulta General"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
