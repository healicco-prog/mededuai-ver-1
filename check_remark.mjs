import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src/app/dashboard');
let foundIssues = false;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('remarkMath') && !content.includes('import remarkMath')) {
        console.log(`Missing import in: ${file}`);
        foundIssues = true;
    }
});

if (!foundIssues) {
    console.log('No missing remarkMath imports found!');
}
