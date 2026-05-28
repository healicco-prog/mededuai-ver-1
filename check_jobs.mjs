import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobs() {
    console.log('Checking creator_jobs...');
    
    // Check table existence and counts
    const { data: counts, error: countErr } = await supabase
        .from('creator_jobs')
        .select('status');

    if (countErr) {
        console.error('❌ Failed to fetch jobs:', countErr.message);
        return;
    }

    const stats = counts.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
    }, {});

    console.log('Job Stats:', stats);

    // Check for recent processing jobs
    const { data: processingJobs, error: procErr } = await supabase
        .from('creator_jobs')
        .select('*')
        .eq('status', 'processing')
        .order('updated_at', { ascending: false });

    if (processingJobs && processingJobs.length > 0) {
        console.log('\nProcessing Jobs (last 5):');
        processingJobs.slice(0, 5).forEach(j => {
            console.log(`- ID: ${j.id}, Topic: ${j.topic_name}, Updated: ${j.updated_at}, Batch: ${j.batch_id}`);
        });
    }

    // Check for failed jobs
    const { data: failedJobs, error: failErr } = await supabase
        .from('creator_jobs')
        .select('*')
        .eq('status', 'failed')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (failedJobs && failedJobs.length > 0) {
        console.log('\nFailed Jobs (last 5):');
        failedJobs.forEach(j => {
            console.log(`- ID: ${j.id}, Topic: ${j.topic_name}, Error: ${j.error_message}`);
        });
    }

    // Check for pending jobs
    const { data: pendingJobs } = await supabase
        .from('creator_jobs')
        .select('id')
        .eq('status', 'pending');
    
    console.log(`\nPending Jobs Count: ${pendingJobs?.length || 0}`);
}

checkJobs();
