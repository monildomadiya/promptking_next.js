const fs = require('fs');

const files = [
  'app/api/admin/analytics/reset/route.js',
  'app/api/admin/dashboard/route.js',
  'app/api/admin/prompts/route.js',
  'app/api/admin/reorder_prompts/route.js',
  'app/api/admin/save_prompt/route.js',
  'app/api/admin/toggle_status/route.js',
  'app/api/admin/upload_image/route.js'
];

files.forEach(f => {
  const file = `D:/DJ Projects/promptking.in/${f}`;
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let updated = false;
  
  if (content.includes("import { getSession } from '@/lib/session';")) {
    content = content.replace("import { getSession } from '@/lib/session';", "import { getAdminAuth } from '@/lib/auth';");
    updated = true;
  }
  
  if (content.includes("const session = await getSession();")) {
    content = content.replace("const session = await getSession();\n  if (!session?.isAdmin)", "const isAdmin = await getAdminAuth(req);\n  if (!isAdmin)");
    content = content.replace("const session = await getSession();\r\n  if (!session?.isAdmin)", "const isAdmin = await getAdminAuth(req);\r\n  if (!isAdmin)");
    updated = true;
  }
  
  if (updated) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
