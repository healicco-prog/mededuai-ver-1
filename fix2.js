const fs = require('fs');

let content = fs.readFileSync('src/app/contrl-panl/page.tsx', 'utf8');

// Replace everything from the start of the component to the dashboard layout
const startMarker = 'export default function ControlPanelPage() {';
const endMarker = '/* ── DASHBOARD LAYOUT ── */';

if (content.includes(startMarker) && content.includes(endMarker)) {
    const before = content.substring(0, content.indexOf(startMarker) + startMarker.length);
    const after = content.substring(content.indexOf(endMarker));

    const newComponentLogic = `
    const [authRole, setAuthRole] = useState<string | null>(null);
    const [authLabel, setAuthLabel] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeSectionKey, setActiveSectionKey] = useState<SectionKey | null>(null);

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
        return <div className="min-h-screen flex items-center justify-center text-slate-800">Loading secure console...</div>;
    }

    `;

    fs.writeFileSync('src/app/contrl-panl/page.tsx', before + newComponentLogic + after);
    console.log('Fixed page!');
} else {
    console.log('Markers not found');
}
