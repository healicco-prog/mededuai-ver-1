const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'src/app/api/creator/load/route.ts',
  'src/app/api/creator/hierarchy/route.ts',
  'src/app/api/creator/topic-notes/route.ts',
  'src/app/api/creator/db-migrate/route.ts',
  'src/app/api/creator/db-test/route.ts',
  'src/app/api/creator/route.ts',
  'src/app/api/referral/stats/route.ts'
];

for (const file of filesToPatch) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('checkSecurity')) continue;
  
  // Add import if not present
  if (!content.includes('checkSecurity')) {
    content = content.replace(/import \{ NextResponse \} from 'next\\/server';/, "import { NextResponse } from 'next/server';\nimport { checkSecurity } from '@/lib/apiSecurity';");
  }
  
  // Patch GET
  content = content.replace(/export async function GET\(\) \{/, "export async function GET(req: Request) {\n    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });\n    if (!sec.authorized) return sec.response;\n");
  content = content.replace(/export async function GET\(req: Request\) \{/, "export async function GET(req: Request) {\n    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });\n    if (!sec.authorized) return sec.response;\n");

  
  // Patch POST
  content = content.replace(/export async function POST\(\) \{/, "export async function POST(req: Request) {\n    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });\n    if (!sec.authorized) return sec.response;\n");
  content = content.replace(/export async function POST\(req: Request\) \{/, "export async function POST(req: Request) {\n    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });\n    if (!sec.authorized) return sec.response;\n");

  fs.writeFileSync(file, content);
  console.log('Patched ' + file);
}
