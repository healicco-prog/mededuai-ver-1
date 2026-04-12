import fs from 'fs';
import path from 'path';

const API_DIR = './src/app/api';

const excludeFolders = ['auth', 'razorpay', 'contact', 'cron'];

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!excludeFolders.includes(file)) {
                results = results.concat(getFiles(fullPath));
            }
        } else if (file === 'route.ts') {
            results.push(fullPath);
        }
    });
    return results;
}

const files = getFiles(API_DIR);
console.log(`Found ${files.length} route files to process.`);

const SECURITY_IMPORT = `import { checkSecurity, validateInput } from '@/lib/apiSecurity';\n`;

const SECURITY_BLOCK = `
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;
`;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Skip if already secured
    if (content.includes('checkSecurity')) continue;
    if (content.includes('verifyAuthAndRole')) {
        console.log(`Skipping partially secured file (manual fix recommended): ${file}`);
        continue;
    }

    // Add import
    if (!content.includes(SECURITY_IMPORT)) {
        content = SECURITY_IMPORT + content;
    }

    // Attempt to inject at the start of POST handler
    const match = content.match(/export\s+async\s+function\s+POST\s*\(\s*(req|request)\s*(:\s*(Request|NextRequest|any))?\s*\)\s*\{/);
    if (match) {
        const reqName = match[1];
        const block = `
    const sec = await checkSecurity(${reqName});
    if (!sec.authorized) return sec.response;
`;
        
        const insertPos = match.index + match[0].length;
        content = content.slice(0, insertPos) + block + content.slice(insertPos);
        fs.writeFileSync(file, content);
        console.log(`Secured: ${file}`);
    } else {
        console.log(`Could not find standard POST handler in: ${file}`);
    }
}
