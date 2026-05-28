import fs from 'fs';
import path from 'path';

const IGNORED = ['ReactMarkdown', 'ReactCrop', 'HTMLInputElement', 'Record', 'EvaluatedStudent', 'File', 'Blob', 'Document', 'Map', 'Set', 'Date', 'JSON', 'Math', 'Number', 'String', 'Object', 'Array', 'Boolean'];

function check(file) {
    const code = fs.readFileSync(file, 'utf-8');
    const m = code.match(/<([A-Z][a-zA-Z0-9]*)/g);
    if (!m) return;
    const tags = [...new Set(m)].map(t => t.substring(1));
    const impMatch = code.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
    if (!impMatch) return;
    const imports = impMatch[1].split(',').map(s => s.trim().split(' as ')[0]);
    const missing = tags.filter(t => !imports.includes(t) && !IGNORED.includes(t) && t === t.charAt(0).toUpperCase() + t.slice(1));
    
    // Simple check: is this tag imported at all in the file?
    const trulyMissing = missing.filter(tag => {
        const importRegex = new RegExp(`import.*\\b${tag}\\b`);
        return !importRegex.test(code);
    });

    if (trulyMissing.length > 0) console.log(file, trulyMissing);
}

function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.tsx')) check(p);
    });
}
walk('src/app/dashboard/admin');
