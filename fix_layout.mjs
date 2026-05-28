import fs from 'fs';

const file = 'src/app/dashboard/DashboardLayoutClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /(<LockedSidebarItem label="Rubrics Generator" requiredPlan="Standard" \/>\s*\n\s*\}\))/g;

const newContent1 = `$1
                            {isFeatureAccessible('assignments') ? (
                                <SidebarItem href={\`/dashboard/teacher/assignments\`} icon={ClipboardType} label="Assignments" />
                            ) : (
                                <LockedSidebarItem label="Assignments" requiredPlan="Standard" />
                            )}`;

const newContent2 = `$1
                            {isFeatureAccessible('assignments') ? (
                                <SidebarItem href={\`/dashboard/admin/assignments\`} icon={ClipboardType} label="Assignments" />
                            ) : (
                                <LockedSidebarItem label="Assignments" requiredPlan="Standard" />
                            )}`;

let matchCount = 0;
content = content.replace(regex1, (match) => {
    matchCount++;
    if (matchCount === 1) {
        return newContent1.replace('$1', match);
    } else {
        return newContent2.replace('$1', match);
    }
});

fs.writeFileSync(file, content, 'utf8');
console.log('Done replacements:', matchCount);
