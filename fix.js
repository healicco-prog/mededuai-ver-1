const fs = require('fs');
const path = require('path');

const files = [
    'src/app/dashboard/teacher/q-paper/page.tsx',
    'src/app/dashboard/teacher/ems/page.tsx',
    'src/app/dashboard/teacher/attendance/page.tsx',
    'src/app/dashboard/student/vocab/page.tsx',
    'src/app/dashboard/student/viva/page.tsx',
    'src/app/dashboard/student/mentor/page.tsx',
    'src/app/dashboard/student/imp-questions/page.tsx',
    'src/app/dashboard/student/eval/page.tsx',
];

files.forEach(f => {
    const fullPath = path.join(__dirname, f);
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/\\`/g, '`');
    content = content.replace(/\\\$/g, '$');
    fs.writeFileSync(fullPath, content);
});
console.log('Fixed syntax errors');
