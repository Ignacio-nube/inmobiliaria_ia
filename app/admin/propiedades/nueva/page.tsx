import { createClient } from '@/lib/supabase/server';
import { PublishForm } from '@/components/properties/PublishForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Nueva Propiedad | Admin',
};

export default async function NewPropertyPage() {
    return (
        <div>
            <Link
                href="/admin/propiedades"
                className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a propiedades
            </Link>

            <h1 className="text-3xl font-bold text-white mb-2">Nueva Propiedad</h1>
            <p className="text-slate-400 mb-8">Completá los datos para agregar una nueva propiedad al catálogo.</p>

            <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-8">
                <PublishForm />
            </div>
        </div>
    );
}
