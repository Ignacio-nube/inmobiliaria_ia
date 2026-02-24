import { PublishForm } from '@/components/properties/PublishForm';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export const metadata = {
    title: 'Editar Propiedad | Admin',
};

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();

    // Fetch existing property data
    const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error || !property) {
        notFound();
    }

    return (
        <div className="pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-medium tracking-tight text-foreground mb-2">
                    Editar Propiedad
                </h1>
                <p className="text-muted-foreground text-sm">
                    Modificá los detalles de esta propiedad existente.
                </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <PublishForm initialData={property} />
            </div>
        </div>
    );
}
