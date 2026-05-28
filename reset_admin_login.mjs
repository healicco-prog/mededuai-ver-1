/**
 * reset_admin_login.mjs
 * ----------------------------------------------------------------------------
 * One-shot repair tool for the Control Panel login.
 *   - Validates env vars in .env.local
 *   - Probes the service-role key
 *   - Creates or updates the Super Admin / Master Admin accounts (idempotent)
 *   - Upserts matching rows in profiles + users
 *   - Verifies end-to-end via signInWithPassword
 *
 * Usage:  node reset_admin_login.mjs
 * ----------------------------------------------------------------------------
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('FATAL: .env.local not found at', envPath);
    process.exit(1);
}
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const idx = line.indexOf('=');
    if (idx < 0) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim().replace(/^"|"$/g, '').replace(/\r/g, '');
    if (val.includes(' # ')) val = val.split(' # ')[0].trim();
    if (key) env[key] = val;
});

const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;

function bail(msg) { console.error('FATAL:', msg); process.exit(1); }

if (!SUPA_URL || !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(SUPA_URL))
    bail('NEXT_PUBLIC_SUPABASE_URL is missing or malformed: ' + SUPA_URL);
if (!ANON || ANON.length < 100)
    bail('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or too short (len=' + (ANON ? ANON.length : 0) + ')');
if (!SVC || SVC.length < 30)
    bail('SUPABASE_SERVICE_ROLE_KEY is missing or too short (len=' + (SVC ? SVC.length : 0) + ')');

console.log('Connecting to', SUPA_URL);
console.log('Anon prefix   :', ANON.slice(0, 12), '... len=', ANON.length);
console.log('Service prefix:', SVC.slice(0, 12), '... len=', SVC.length);

const admin = createClient(SUPA_URL, SVC, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const customPassword = process.argv[2];
if (customPassword) {
    console.log('NOTE: Using custom password supplied via command line for drnarayanak@gmail.com:', customPassword);
}

const ADMINS = [
    { email: 'drnarayanak@gmail.com',     password: customPassword || 'Tata-Vidhya-Narayana-2026', role: 'super_admin',  full_name: 'Dr. Narayana K (Super)' },
    { email: 'katakepradeep11@gmail.com', password: 'User-Akash@2026',           role: 'master_admin', full_name: 'Katake Pradeep (Master)' },
];

async function probeServiceKey() {
    const probe = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (probe.error) {
        console.error('\nFATAL: Supabase rejected the service-role key.');
        console.error('  message :', probe.error.message);
        console.error('  status  :', probe.error.status || 'n/a');
        console.error('\nFix: open Supabase Dashboard -> Project Settings -> API,');
        console.error('copy the service_role (secret) key into .env.local as');
        console.error('SUPABASE_SERVICE_ROLE_KEY=..., save, and re-run this script.');
        process.exit(1);
    }
    console.log('Service-role key OK.');
}

async function findUser(email) {
    for (let page = 1; page <= 10; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) { console.error('  listUsers error:', error.message); return null; }
        const u = data && data.users && data.users.find(x => (x.email || '').toLowerCase() === email.toLowerCase());
        if (u) return u;
        if (!data || !data.users || data.users.length < 200) return null;
    }
    return null;
}

async function ensureAdmin(a) {
    console.log('\n---- ' + a.email + ' ----');
    let user = await findUser(a.email);

    if (!user) {
        console.log('  not found -- creating');
        const { data, error } = await admin.auth.admin.createUser({
            email: a.email,
            password: a.password,
            email_confirm: true,
            user_metadata: { role: a.role, full_name: a.full_name },
            app_metadata:  { role: a.role },
        });
        if (error) { console.error('  createUser FAILED:', error.message); return false; }
        user = data.user;
        console.log('  created id=' + user.id);
    } else {
        console.log('  found id=' + user.id + ' email_confirmed_at=' + user.email_confirmed_at);
        const { data, error } = await admin.auth.admin.updateUserById(user.id, {
            password: a.password,
            email_confirm: true,
            user_metadata: Object.assign({}, user.user_metadata || {}, { role: a.role, full_name: a.full_name }),
            app_metadata:  Object.assign({}, user.app_metadata  || {}, { role: a.role }),
        });
        if (error) { console.error('  updateUser FAILED:', error.message); return false; }
        user = data.user;
        console.log('  updated (password reset + role refreshed)');
    }

    const profileRow = { id: user.id, role: a.role, full_name: a.full_name, email: a.email };
    const { error: pErr } = await admin.from('profiles').upsert(profileRow, { onConflict: 'id' });
    if (pErr) console.warn('  profiles upsert warning:', pErr.message); else console.log('  profiles row OK');

    const { error: uErr } = await admin.from('users').upsert(profileRow, { onConflict: 'id' });
    if (uErr) console.warn('  users upsert warning:', uErr.message); else console.log('  users row OK');

    const anonClient = createClient(SUPA_URL, ANON, { auth: { persistSession: false } });
    const { data: signIn, error: signInErr } = await anonClient.auth.signInWithPassword({
        email: a.email, password: a.password,
    });
    if (signInErr || !signIn || !signIn.user) {
        console.error('  VERIFY FAILED:', (signInErr && signInErr.message) || 'no user returned');
        return false;
    }
    const verifiedRole = signIn.user.user_metadata && signIn.user.user_metadata.role;
    console.log('  VERIFY OK -- sign-in succeeded, role=' + verifiedRole);
    return true;
}

(async () => {
    await probeServiceKey();
    let allOk = true;
    for (const a of ADMINS) {
        const ok = await ensureAdmin(a);
        if (!ok) allOk = false;
    }
    console.log('\n--------------------------------------------');
    if (allOk) {
        console.log('SUCCESS: All admin accounts are ready.');
        console.log('Sign in at http://localhost:3000/contrl-panl with:');
        console.log('  drnarayanak@gmail.com     /  Tata-Vidhya-Narayana-2026');
        console.log('  katakepradeep11@gmail.com /  User-Akash@2026');
        process.exit(0);
    } else {
        console.error('FAILED: One or more admin accounts could not be reset. See errors above.');
        process.exit(2);
    }
})().catch((e) => { console.error('Unhandled error:', e); process.exit(1); });
