import { PublishForm } from '@/components/properties/PublishForm';

export const metadata = {
    title: 'Publicar Propiedad',
    description: 'Publica tu propiedad en venta o alquiler en Ignacio Propiedades.',
};

export default function PublishPage() {
    return (
        <div className="min-h-screen bg-background pt-24 pb-12">
            <div className="max-w-3xl mx-auto px-6">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-heading font-medium tracking-tight text-foreground mb-4">
                        Publicar Propiedad
                    </h1>
                    <p className="text-muted-foreground">
                        Completá los datos de tu propiedad para publicarla en nuestro sitio.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                    <PublishForm />
                </div>
            </div>
        </div>
    );
}
