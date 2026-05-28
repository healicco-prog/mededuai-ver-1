import fs from 'fs';

const file = 'src/app/dashboard/DashboardLayoutClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `                              {isFeatureAccessible('rubrics-generator') ? (
                                  <SidebarItem href={\`/dashboard/teacher/rubrics-generator\`} icon={ClipboardList} label="Rubrics Generator" />
                              ) : (
                                  <LockedSidebarItem label="Rubrics Generator" requiredPlan="Standard" />
                              )}`;

const replacement1 = target1 + `
                              {isFeatureAccessible('assignments') ? (
                                  <SidebarItem href={\`/dashboard/teacher/assignments\`} icon={ClipboardType} label="Assignments" />
                              ) : (
                                  <LockedSidebarItem label="Assignments" requiredPlan="Standard" />
                              )}`;

const target2 = `                              {isFeatureAccessible('rubrics-generator') ? (
                                  <SidebarItem href={\`/dashboard/admin/rubrics-generator\`} icon={ClipboardList} label="Rubrics Generator" />
                              ) : (
                                  <LockedSidebarItem label="Rubrics Generator" requiredPlan="Standard" />
                              )}`;

const replacement2 = target2 + `
                              {isFeatureAccessible('assignments') ? (
                                  <SidebarItem href={\`/dashboard/admin/assignments\`} icon={ClipboardType} label="Assignments" />
                              ) : (
                                  <LockedSidebarItem label="Assignments" requiredPlan="Standard" />
                              )}`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);

fs.writeFileSync(file, content, 'utf8');
console.log('Done replacing layout');
