import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const backendUrl = "https://mededuai-backend-mfz5ejaqaa-uc.a.run.app";
const adminSecret = process.env.ADMIN_SECRET;

async function trigger() {
    console.log('🚀 Triggering batch process...');
    try {
        const res = await fetch(`${backendUrl}/api/creator/batch-process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-secret': adminSecret
            },
            body: JSON.stringify({ action: 'process' })
        });
        
        const data = await res.json();
        console.log('Response:', data);
    } catch (err) {
        console.error('Trigger failed:', err);
    }
}

trigger();
