import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContent() {
    const { data, error } = await supabase
        .from('lms_content')
        .select('id, topic, last_generated_at')
        .order('last_generated_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    console.log('Recent Content:', data);
}

checkContent();
