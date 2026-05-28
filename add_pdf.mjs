import fs from 'fs';
import path from 'path';

const dirs = [
    'src/app/dashboard/student',
    'src/app/dashboard/teacher',
    'src/app/dashboard/deptadmin'
];

const pdfButtonCode = `
                                    <button onClick={() => window.print()} className="font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 print:hidden ml-2" title="Share as PDF">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> 
                                        Share as PDF
                                    </button>
`;

function processDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            if (content.includes('Share as PDF') || content.includes('Download PDF') || content.includes('Apply & Save Crop') || fullPath.includes('notes-creator') || fullPath.includes('rubrics-generator')) {
                continue;
            }

            let modified = false;
            const handlers = ['handleSave', 'handleSaveToDatabase', 'handleSaveExam', 'handleSaveSession', 'handleSaveAllToDb', 'handleSaveReflection'];
            
            for (const handler of handlers) {
                // Using string concatenation to build the regex string correctly without literal template issues
                const regexStr = '(<button[^>]*onClick=\\{?\\b' + handler + '\\b\\}?[\\s\\S]*?<\\/button>)';
                const regex = new RegExp(regexStr, 'g');
                
                content = content.replace(regex, (match) => {
                    modified = true;
                    return match + pdfButtonCode;
                });
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Modified:', fullPath);
            }
        }
    }
}

dirs.forEach(processDir);
