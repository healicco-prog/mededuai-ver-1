import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToCheck = [
    'profiles',
    'courses',
    'subjects',
    'topics',
    'lms_content',
    'assessments',
    'blogs',
    'posts',
    'tokens'
];

async function checkTables() {
    console.log('Checking Supabase tables...');
    for (const table of tablesToCheck) {
        const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ Table '${table}' check failed: ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`✅ Table '${table}' exists (Count: ${data?.length ?? 0})`);
        }
    }
}

checkTables();
