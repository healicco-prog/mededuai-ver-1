import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const backendUrl = "https://mededuai-backend-mfz5ejaqaa-uc.a.run.app";
const adminSecret = process.env.ADMIN_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getBatchIds() {
    const { data, error } = await supabase
        .from('creator_jobs')
        .select('batch_id')
        .eq('status', 'pending');
    
    if (error) throw error;
    return [...new Set(data.map(j => j.batch_id))];
}

async function processBatch(batchId) {
    let done = false;
    let consecutiveFailures = 0;

    console.log(`\n📂 Processing Batch: ${batchId}`);
    while (!done && consecutiveFailures < 5) {
        try {
            const res = await fetch(`${backendUrl}/api/creator/batch-process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': adminSecret
                },
                body: JSON.stringify({ batchId })
            });
            
            const data = await res.json();
            if (data.success) {
                if (data.status === 'completed') {
                    console.log(`  ✅ COMPLETED: ${data.topicName} (${data.remaining} left)`);
                    consecutiveFailures = 0;
                } else if (data.status === 'pending') {
                    console.log(`  ↻ RETRYING: ${data.topicName} - ${data.error}`);
                    console.log('  ⏳ Sleeping 45s to respect rate limits...');
                    await new Promise(r => setTimeout(r, 45000));
                    consecutiveFailures = 0;
                } else if (data.waitingForStaleRecovery) {
                    console.log(`  ⏳ Waiting for stale recovery (${data.processingCount} in flight)...`);
                    await new Promise(r => setTimeout(r, 30000));
                } else if (data.done) {
                    console.log('  ✨ Batch finished.');
                    done = true;
                } else {
                    console.log(`  ⚠️ Status: ${data.status} for ${data.topicName}`);
                    consecutiveFailures++;
                }
                done = data.done;
            } else {
                console.error(`  ❌ API Error: ${data.error}`);
                consecutiveFailures++;
                await new Promise(r => setTimeout(r, 10000));
            }
        } catch (err) {
            console.error('  🔥 Fetch error:', err.message);
            consecutiveFailures++;
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

async function runAll() {
    console.log('🔍 Fetching pending batches...');
    const batchIds = await getBatchIds();
    console.log(`🚀 Found ${batchIds.length} batches. Starting...`);

    for (const id of batchIds) {
        await processBatch(id);
    }
    console.log('\n✨ ALL BATCHES PROCESSED.');
}

runAll();
