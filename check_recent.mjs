import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentJobs() {
    console.log('Checking recent 10 jobs...');
    
    const { data: jobs, error } = await supabase
        .from('creator_jobs')
        .select('id, status, topic_name, error_message, updated_at, batch_id')
        .order('updated_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ Failed to fetch jobs:', error.message);
        return;
    }

    jobs.forEach(j => {
        console.log(`- [${j.status}] ${j.topic_name} (Batch: ${j.batch_id.slice(0,8)}) Updated: ${j.updated_at}`);
        if (j.error_message) console.log(`  Error: ${j.error_message}`);
    });
}

checkRecentJobs();
