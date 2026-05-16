const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src/app/api');
const insecureFiles = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('export async function POST') || content.includes('export async function GET')) {
        // Look for common auth checks
        const hasCheckSecurity = content.includes('checkSecurity');
        const hasSupabaseAuth = content.includes('supabase.auth.getSession') || content.includes('supabase.auth.getUser');
        const hasAuthGuard = content.includes('requireAuth') || content.includes('withAuth');
        
        // Let's exclude public routes like webhooks or login
        const isPublic = file.includes('/auth/') || file.includes('razorpay');

        if (!hasCheckSecurity && !hasSupabaseAuth && !hasAuthGuard && !isPublic) {
            insecureFiles.push(file);
        }
    }
});

console.log(JSON.stringify(insecureFiles, null, 2));
