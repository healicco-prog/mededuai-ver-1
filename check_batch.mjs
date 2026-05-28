import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBatch(batchId) {
    console.log(`Checking batch ${batchId}...`);
    
    const { data: jobs, error } = await supabase
        .from('creator_jobs')
        .select('status, topic_name, error_message, updated_at')
        .eq('batch_id', batchId);

    if (error) {
        console.error('❌ Failed to fetch batch:', error.message);
        return;
    }

    const stats = jobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
    }, {});

    console.log('Batch Stats:', stats);
    console.log('Total:', jobs.length);

    const processing = jobs.filter(j => j.status === 'processing');
    if (processing.length > 0) {
        console.log('\nProcessing Topics:');
        processing.forEach(j => console.log(`- ${j.topic_name} (Updated: ${j.updated_at})`));
    }

    const failed = jobs.filter(j => j.status === 'failed');
    if (failed.length > 0) {
        console.log('\nFailed Topics (last 5):');
        failed.slice(0, 5).forEach(j => console.log(`- ${j.topic_name}: ${j.error_message}`));
    }
}

// Get the latest batch ID from the DB
async function getLatestBatchId() {
    const { data, error } = await supabase
        .from('creator_jobs')
        .select('batch_id')
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (data && data.length > 0) {
        return data[0].batch_id;
    }
    return null;
}

getLatestBatchId().then(batchId => {
    if (batchId) {
        checkBatch(batchId);
    } else {
        console.log('No batches found.');
    }
});
