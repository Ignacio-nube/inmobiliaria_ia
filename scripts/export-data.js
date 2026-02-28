import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
        const val = values.join('=').trim().replace(/^"|"$/g, '');
        process.env[key.trim()] = val;
    }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportProperties() {
    console.log("Fetching properties from Supabase...");
    const { data, error } = await supabase.from('properties').select('*');

    if (error) {
        console.error("Error fetching properties:", error);
        process.exit(1);
    }

    if (!data) {
        console.log("No data found");
        return;
    }

    const outputPath = path.join(process.cwd(), 'properties_export.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Successfully exported ${data.length} properties to ${outputPath}`);
}

exportProperties();
