const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/api/admin/**/*.js', { cwd: 'D:/DJ Projects/promptking.in', absolute: true });

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("import { getSession } from '@/lib/session';") || content.includes("const session = await getSession();")) {
    content = content.replace("import { getSession } from '@/lib/session';", "import { getAdminAuth } from '@/lib/auth';");
    content = content.replace("const session = await getSession();\n  if (!session?.isAdmin)", "const isAdmin = await getAdminAuth(req);\n  if (!isAdmin)");
    content = content.replace("const session = await getSession();\r\n  if (!session?.isAdmin)", "const isAdmin = await getAdminAuth(req);\r\n  if (!isAdmin)");
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
