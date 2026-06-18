const fs = require('fs');
const path = require('path');

const files = [
  'app/api/admin/analytics/blogs/route.js',
  'app/api/admin/analytics/prompts/route.js',
  'app/api/admin/analytics/route.js',
  'app/api/admin/authors/route.js',
  'app/api/admin/blogs/route.js',
  'app/api/admin/categories/route.js',
  'app/api/admin/check_auth/route.js',
  'app/api/admin/dashboard/route.js',
  'app/api/admin/faqs/route.js',
  'app/api/admin/listicles/route.js',
  'app/api/admin/logout/route.js',
  'app/api/admin/prompts/route.js',
  'app/api/admin/settings/route.js',
  'app/api/admin/users/route.js',
  'app/api/admin/website_categories/route.js'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes("export const dynamic = 'force-dynamic';") && content.includes("export async function GET")) {
      content = "export const dynamic = 'force-dynamic';\n" + content;
      fs.writeFileSync(filePath, content);
      console.log('Fixed', file);
    }
  }
});
