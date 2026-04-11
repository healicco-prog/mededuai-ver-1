const { createClient } = require('@supabase/supabase-js');
// Load environment variables manually to avoid next.js loading issues in plain node script
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanMockData() {
  console.log("Starting mock data cleanup...");
  
  // Fetch all lms_content rows with all columns
  const { data: rows, error } = await supabase
    .from('lms_content')
    .select('*');

  if (error) {
    console.error("Error fetching rows:", error);
    process.exit(1);
  }

  let deletedCount = 0;
  for (const row of rows) {
    const jsonStr = JSON.stringify(row);
    if (jsonStr.includes('Live Gemini generation was bypassed') || jsonStr.includes('[Generated Introduction]') || jsonStr.includes('This is a highly structured, auto-generated placeholder')) {
        console.log(`Deleting mock data for row ID: ${row.id}`);
        const { error: delError } = await supabase
            .from('lms_content')
            .delete()
            .eq('id', row.id);
            
        if (delError) {
            console.error(`Failed to delete row ${row.id}:`, delError);
        } else {
            deletedCount++;
        }
    }
  }

  console.log(`Cleanup complete! Deleted ${deletedCount} rows containing mock placeholders.`);
}

cleanMockData();
