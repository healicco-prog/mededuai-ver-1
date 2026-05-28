import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixQueue() {
    console.log('🧹 Starting full queue reset...');

    // Reset everything that isn't 'completed'
    const { data: resetJobs, error: resetError } = await supabase
        .from('creator_jobs')
        .update({ 
            status: 'pending', 
            attempt_count: 0,
            error_message: null,
            updated_at: new Date().toISOString()
        })
        .neq('status', 'completed')
        .select();

    if (resetError) console.error('Error resetting jobs:', resetError);
    else console.log(`✅ Reset ${resetJobs?.length || 0} jobs to pending status.`);

    console.log('✨ Cleanup complete.');
}

fixQueue();
