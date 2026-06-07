const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Admin', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add KingLogo import
if (!content.includes("import KingLogo from '../../assets/prompt-king.webp';")) {
  content = content.replace(
    "import ContextMenu from './ContextMenu';",
    "import ContextMenu from './ContextMenu';\nimport KingLogo from '../../assets/prompt-king.webp';"
  );
}

// 2. Fix Sidebar Scroll
if (content.includes("overflow: 'hidden',")) {
  content = content.replace(
    "flexDirection: 'column',\n            overflow: 'hidden',\n            transition: 'padding 0.3s ease'",
    "flexDirection: 'column',\n            overflowY: 'auto',\n            overflowX: 'hidden',\n            transition: 'padding 0.3s ease'"
  );
}

// 3. Replace Logo Section
const oldLogoTarget = `{sidebarCollapsed ? (
              <div className="animated-logo" style={{ width: '40px', height: '40px', background: 'var(--accent-gradient)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', flexShrink: 0 }}>PK</div>
            ) : settings.logo_url ? (
              <img src={settings.logo_url} style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'contain', padding: '0 10px' }} alt="Logo" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
                <div className="animated-logo" style={{ width: '45px', height: '45px', background: 'var(--accent-gradient)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>PK</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.5px', fontFamily: 'var(--font-heading)' }}>KING ADMIN</h2>
              </div>
            )}`;

const newLogoTarget = `{sidebarCollapsed ? (
              <img src={settings.logo_url || KingLogo} style={{ width: '40px', height: '40px', objectFit: 'contain' }} alt="Logo" />
            ) : settings.logo_url ? (
              <img src={settings.logo_url} style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'contain', padding: '0 10px' }} alt="Logo" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
                <img src={KingLogo} style={{ width: '45px', height: '45px', objectFit: 'contain' }} alt="PromptKing" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.5px', fontFamily: 'var(--font-heading)' }}>PromptKing</h2>
              </div>
            )}`;

if (content.includes('PK</div>')) {
  content = content.replace(oldLogoTarget, newLogoTarget);
}

fs.writeFileSync(filePath, content);
console.log('Fixed Logo and Scroll in AdminDashboard.jsx');
