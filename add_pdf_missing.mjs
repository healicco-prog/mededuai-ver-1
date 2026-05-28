import fs from 'fs';
import path from 'path';

const files = [
    'src/app/dashboard/student/case/page.tsx',
    'src/app/dashboard/teacher/essay-answer/page.tsx',
    'src/app/dashboard/teacher/dig-eval-assist/page.tsx',
    'src/app/dashboard/teacher/lesson-plan/page.tsx'
];

const pdfButtonCode = `
                                    <button onClick={() => window.print()} className="font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 print:hidden ml-2" title="Share as PDF">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> 
                                        Share as PDF
                                    </button>
`;

files.forEach(fullPath => {
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;
        
        if (fullPath.includes('dig-eval-assist')) {
            // handleSaveSession
            const regex = /(<button[^>]*onClick=\{handleSaveSession\}[^>]*>[\s\S]*?<\/button>)/g;
            content = content.replace(regex, match => { modified = true; return match + pdfButtonCode; });
        } else if (fullPath.includes('lesson-plan')) {
            // Here save is automatic or handled differently, there might not be a "Save" button to place next to.
            // There is a 'Print' button, maybe we just leave it since it has Print.
            // Oh wait, there is no generic handleSave in lesson-plan, it saves on changes.
        } else {
            const regex = /(<button[^>]*onClick=\{handleSave\}[^>]*>[\s\S]*?<\/button>)/g;
            content = content.replace(regex, match => { modified = true; return match + pdfButtonCode; });
        }
        
        if (modified) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log('Modified', fullPath);
        } else {
            console.log('Not matched for', fullPath);
        }
    }
});
