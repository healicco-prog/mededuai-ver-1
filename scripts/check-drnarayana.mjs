import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkUser() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Checking auth users...');
    const { data: authData } = await supabase.auth.admin.listUsers();
    const user = authData.users.find(u => u.email === 'drnarayanak@gmail.com');
    
    if (!user) {
        console.log('User not found in auth.users!');
        return;
    }
    console.log('Auth user role:', user.role);
    console.log('Auth user metadata:', user.user_metadata);

    console.log('Checking public.users...');
    const { data: pubUser } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!pubUser) {
        console.log('User not found in public.users!');
        return;
    }
    console.log('Public user:', pubUser);
}

checkUser().catch(console.error);
