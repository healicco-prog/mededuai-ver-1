const fs = require('fs');

let content = fs.readFileSync('src/app/contrl-panl/page.tsx', 'utf8');

// Remove CREDENTIALS constant
content = content.replace(/\/\* ── hardcoded credentials ── \*\/\s*const CREDENTIALS = \[[\s\S]*?\];\s*/m, '');

// Inside the component, replace handleLogin and the login screen rendering
content = content.replace(/\/\* persist lightweight session in sessionStorage \*\/[\s\S]*?(?=\/\* ── DASHBOARD LAYOUT ── \*\/)/m, `
    useEffect(() => {
        // Read role from cookie securely
        const match = document.cookie.match(new RegExp('(^| )role=([^;]+)'));
        if (match) {
            const r = match[2];
            setAuthRole(r);
            setAuthLabel(r.charAt(0).toUpperCase() + r.slice(1));
        } else {
            // Not authenticated -> go to real login
            window.location.href = '/login';
        }
    }, []);

    const handleLogout = async () => {
        document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setAuthRole(null);
        window.location.href = '/login';
    };

    if (!authRole) {
        return <div className="min-h-screen flex items-center justify-center">Loading secure console...</div>;
    }
`);

fs.writeFileSync('src/app/contrl-panl/page.tsx', content);
console.log('Fixed contrl-panl/page.tsx');
