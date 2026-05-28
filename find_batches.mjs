import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findBatches() {
    const { data, error } = await supabase
        .from('creator_jobs')
        .select('batch_id')
        .eq('status', 'pending');

    if (error) {
        console.error(error);
        return;
    }

    const batches = [...new Set(data.map(j => j.batch_id))];
    console.log('Pending Batches:', batches);
}

findBatches();
