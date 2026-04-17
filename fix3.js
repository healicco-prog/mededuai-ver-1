const fs = require('fs');

let content = fs.readFileSync('src/app/contrl-panl/page.tsx', 'utf8');

// Strip CREDENTIALS block entirely
content = content.replace(/\/\* ── hardcoded credentials ── \*\/[\s\S]*?\];/m, '');

// Strip everything from `/* persist lightweight session in sessionStorage */` to `    /* ── DASHBOARD SCREEN (with sidebar like the main dashboard) ── */` and replace it
const replaceRegex = /\/\* persist lightweight session in sessionStorage \*\/[\s\S]*?(?=\/\* ── DASHBOARD SCREEN \(with sidebar like the main dashboard\) ── \*\/)/m;

const newLogic = `
    useEffect(() => {
        const match = document.cookie.match(new RegExp('(^| )role=([^;]+)'));
        if (match && match[2]) {
            const roleStr = match[2];
            setAuthRole(roleStr);
            setAuthLabel(roleStr === 'superadmin' ? 'Super Admin' : 'Admin');
        } else {
            // Unauthenticated
            window.location.href = '/login';
        }
    }, []);

    const handleLogout = () => {
        document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setAuthRole(null);
        window.location.href = '/login';
    };

    if (!authRole) {
        return <div className="min-h-screen flex items-center justify-center p-4">Loading secure console...</div>;
    }

`;

content = content.replace(replaceRegex, newLogic);
fs.writeFileSync('src/app/contrl-panl/page.tsx', content);
console.log('Fixed page!');
