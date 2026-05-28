import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProcessingJobs() {
    console.log('Checking details of processing jobs...');
    
    const { data: jobs, error } = await supabase
        .from('creator_jobs')
        .select('id, topic_name, attempt_count, updated_at, error_message')
        .eq('status', 'processing');

    if (error) {
        console.error('❌ Failed to fetch jobs:', error.message);
        return;
    }

    jobs.forEach(j => {
        console.log(`- ${j.topic_name} (Attempts: ${j.attempt_count}) Updated: ${j.updated_at}`);
        if (j.error_message) console.log(`  Last Error: ${j.error_message}`);
    });
}

checkProcessingJobs();
