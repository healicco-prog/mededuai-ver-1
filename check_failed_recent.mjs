import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFailedJobs() {
    console.log('Checking jobs that failed in the last hour...');
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: jobs, error } = await supabase
        .from('creator_jobs')
        .select('id, topic_name, error_message, updated_at, batch_id')
        .eq('status', 'failed')
        .gt('updated_at', oneHourAgo);

    if (error) {
        console.error('❌ Failed to fetch jobs:', error.message);
        return;
    }

    console.log(`Found ${jobs.length} failed jobs.`);
    jobs.forEach(j => {
        console.log(`- ${j.topic_name} (Batch: ${j.batch_id.slice(0,8)}) Updated: ${j.updated_at}`);
        console.log(`  Error: ${j.error_message}`);
    });
}

checkFailedJobs();
