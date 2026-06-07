const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Admin', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const target1 = "overflow: 'hidden' }}>";
const replacement1 = "}}>";
if (content.includes("<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', width: '100%', overflow: 'hidden' }}>")) {
  content = content.replace("<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', width: '100%', overflow: 'hidden' }}>", "<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', width: '100%' }}>");
}

const target2 = "<img src={settings.logo_url} style={{ height: '90px', maxWidth: '100%', objectFit: 'contain' }} alt=\"Logo\" />";
const replacement2 = "<img src={settings.logo_url} style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'contain', padding: '0 10px' }} alt=\"Logo\" />";

if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
}

fs.writeFileSync(filePath, content);
console.log('Fixed Logo in AdminDashboard.jsx');
