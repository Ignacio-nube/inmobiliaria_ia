"use client";

interface PropertyMapProps {
    latitude: number;
    longitude: number;
    title: string;
    address?: string;
}

export function PropertyMap({ latitude, longitude, title, address }: PropertyMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    // Fallback if no API key: use OpenStreetMap embed
    if (!apiKey) {
        const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005},${latitude - 0.005},${longitude + 0.005},${latitude + 0.005}&layer=mapnik&marker=${latitude},${longitude}`;
        return (
            <div className="rounded-2xl overflow-hidden bg-muted aspect-[16/9]">
                <iframe
                    src={osmUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    title={`Ubicación de ${title}`}
                />
            </div>
        );
    }

    const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=16`;

    return (
        <div className="rounded-2xl overflow-hidden bg-muted aspect-[16/9]">
            <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Ubicación de ${title}`}
            />
        </div>
    );
}
