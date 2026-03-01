import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Valid cities according to lib/locations.ts
const VALID_CITIES = [
    "San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo", "Banda del Río Salí",
    "Alderetes", "Lules", "Bella Vista", "Concepción", "Aguilares", "Monteros",
    "Famaillá", "Tafí del Valle", "San Javier", "Trancas", "Alberdi",
    "El Manantial", "San Pablo", "Las Talitas" // we will add Las Talitas since it's a valid city in Tucuman shown in data
];

// Load env vars
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            const val = values.join('=').trim().replace(/^"|"$/g, '');
            process.env[key.trim()] = val;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function determineCity(prop) {
    const searchString = `${prop.city || ''} ${prop.location || ''} ${prop.address || ''} ${prop.neighborhood || ''}`.toLowerCase();

    if (searchString.includes('yerba buena')) return 'Yerba Buena';
    if (searchString.includes('tafí viejo') || searchString.includes('tafi viejo')) return 'Tafí Viejo';
    if (searchString.includes('banda del río salí') || searchString.includes('banda del rio sali')) return 'Banda del Río Salí';
    if (searchString.includes('alderetes')) return 'Alderetes';
    if (searchString.includes('lules')) return 'Lules';
    if (searchString.includes('bella vista')) return 'Bella Vista';
    if (searchString.includes('concepción') || searchString.includes('concepcion')) return 'Concepción';
    if (searchString.includes('aguilares')) return 'Aguilares';
    if (searchString.includes('monteros')) return 'Monteros';
    if (searchString.includes('famaillá') || searchString.includes('famailla')) return 'Famaillá';
    if (searchString.includes('tafí del valle') || searchString.includes('tafi del valle')) return 'Tafí del Valle';
    if (searchString.includes('san javier')) return 'San Javier';
    if (searchString.includes('trancas')) return 'Trancas';
    if (searchString.includes('alberdi')) return 'Alberdi';
    if (searchString.includes('el manantial')) return 'El Manantial';
    if (searchString.includes('san pablo')) return 'San Pablo';
    if (searchString.includes('talitas')) return 'Las Talitas';

    // Default to San Miguel de Tucumán for "centro", "barrio norte", etc.
    return 'San Miguel de Tucumán';
}

async function fixLocations() {
    console.log("Fetching properties from Supabase...");
    const { data: properties, error } = await supabase.from('properties').select('*');

    if (error) {
        console.error("Error fetching properties:", error);
        return;
    }

    let updatedCount = 0;

    for (const prop of properties) {
        const standardCity = determineCity(prop);
        const standardProvince = 'Tucumán';
        const standardLocation = `${standardCity}, ${standardProvince}`;

        // Let's migrate legacy location/neighborhood data if they put neighborhood in location
        let newNeighborhood = prop.neighborhood;
        if (!newNeighborhood && prop.location && prop.location.toLowerCase().includes('barrio')) {
            newNeighborhood = prop.location;
        } else if (!newNeighborhood && prop.location && prop.location.toLowerCase().includes('centro')) {
            newNeighborhood = 'Centro';
        }

        let shouldUpdate = false;
        if (prop.city !== standardCity || prop.province !== standardProvince || prop.location !== standardLocation || prop.neighborhood !== newNeighborhood) {
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            const { error: updateError } = await supabase
                .from('properties')
                .update({
                    city: standardCity,
                    province: standardProvince,
                    location: standardLocation,
                    neighborhood: newNeighborhood || prop.neighborhood
                })
                .eq('id', prop.id);

            if (updateError) {
                console.error(`Error updating property ${prop.id}:`, updateError);
            } else {
                console.log(`Updated property: ${prop.title} -> ${standardCity}`);
                updatedCount++;
            }
        }
    }
    console.log(`Updated ${updatedCount} properties in the database.`);

    // Now re-run export
    console.log("Re-exporting JSON...");
    const { data: newData } = await supabase.from('properties').select('*');
    const outputPath = path.join(process.cwd(), 'properties_export.json');
    fs.writeFileSync(outputPath, JSON.stringify(newData, null, 2));
    console.log(`Successfully exported updated properties to ${outputPath}`);
}

fixLocations();
