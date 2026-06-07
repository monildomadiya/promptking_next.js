const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Admin', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Imports
if (!content.includes('react-hot-toast')) {
  content = content.replace("import KingDialog from '../Modals/KingDialog';", "import KingDialog from '../Modals/KingDialog';\nimport toast, { Toaster } from 'react-hot-toast';\nimport CommandPalette from './CommandPalette';\nimport ContextMenu from './ContextMenu';");
}

// 2. Add Badges
const badgeTarget = "{item.hide_prompt_box && <span style={{ fontSize: '0.65rem', color: '#fbbf24', border: '1px solid #fbbf24', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px' }}>HIDDEN</span>}";
const badgeReplacement = "{item.hide_prompt_box && <span style={{ fontSize: '0.65rem', color: '#fbbf24', border: '1px solid #fbbf24', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px' }}>HIDDEN</span>}\n              {item.is_draft && <span style={{ fontSize: '0.65rem', color: '#9ca3af', border: '1px solid #9ca3af', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', marginLeft: '4px' }}>DRAFT</span>}\n              {item.publish_date && new Date(item.publish_date) > new Date() && <span style={{ fontSize: '0.65rem', color: '#3b82f6', border: '1px solid #3b82f6', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', marginLeft: '4px' }}>SCHEDULED</span>}";
content = content.split(badgeTarget).join(badgeReplacement);

// 3. Add ContextMenu to SortableRow
content = content.replace("isMobile, isDragMode }) => {", "isMobile, isDragMode, onContextMenu }) => {");
content = content.replace("<tr ref={setNodeRef} style={style}>", "<tr ref={setNodeRef} style={style} onContextMenu={(e) => onContextMenu && onContextMenu(e, item)}>");

// 4. Add states to AdminDashboard
const stateTarget = "const [sortBy, setSortBy] = useState('default');";
const stateReplacement = "const [sortBy, setSortBy] = useState('default');\n  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);\n  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, item: null });\n  const [filterStatus, setFilterStatus] = useState('all');\n  const [filterAccess, setFilterAccess] = useState('all');";
if (!content.includes('isCommandPaletteOpen')) {
  content = content.replace(stateTarget, stateReplacement);
}

// 5. Update Keyboard Shortcuts for Ctrl+K
const kTarget = "case '[': setSidebarCollapsed(c => !c); break;";
const kReplacement = "case '[': setSidebarCollapsed(c => !c); break;\n        case 'k':\n        case 'K':\n          if (e.ctrlKey || e.metaKey) {\n            e.preventDefault();\n            setIsCommandPaletteOpen(o => !o);\n          }\n          break;";
if (!content.includes("case 'k':")) {
  content = content.replace(kTarget, kReplacement);
}

// 6. Handle Context Menu Actions
const contextMenuHandlers = `
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, item });
  };

  const getContextMenuActions = () => {
    if (!contextMenu.item) return [];
    return [
      { label: 'Edit', icon: <Edit size={14} />, onClick: () => setEditingItem(contextMenu.item) },
      { label: 'Toggle Featured', icon: <Crown size={14} />, onClick: () => handleToggleFeatured(contextMenu.item) },
      { type: 'divider' },
      { label: 'Delete', icon: <Trash size={14} />, danger: true, onClick: () => handleDelete(contextMenu.item) }
    ];
  };

  const handleCommandAction = (action, item) => {
    setIsCommandPaletteOpen(false);
    switch (action) {
      case 'NEW_PROMPT': setView('prompts'); setEditingItem(null); setIsModalOpen(true); break;
      case 'NEW_BLOG': setView('blogs'); setEditingItem(null); setIsModalOpen(true); break;
      case 'NAV_SETTINGS': setView('settings'); break;
      case 'NAV_BRANDING': setView('branding'); break;
      case 'RESET_ANALYTICS': handleResetAnalytics(); break;
      case 'LOGOUT': handleLogout(); break;
      case 'EDIT_ITEM': 
        if (item.prompt_key) setView('prompts');
        else if (item.slug && item.content) setView('blogs');
        else if (item.answer) setView('faqs');
        setEditingItem(item); 
        setIsModalOpen(true); 
        break;
      default: break;
    }
  };
`;
if (!content.includes('handleContextMenu')) {
  content = content.replace("const handleLogout", contextMenuHandlers + "\n  const handleLogout");
}

// 7. Inject SortableRow prop
content = content.replace("onToggleFeatured={handleToggleFeatured}\n                                    isMobile={isMobile}\n                                    isDragMode={isDragMode}\n                                  />", "onToggleFeatured={handleToggleFeatured}\n                                    isMobile={isMobile}\n                                    isDragMode={isDragMode}\n                                    onContextMenu={handleContextMenu}\n                                  />");

// 8. Add Filter UI (after adminSearch input)
const searchTarget = "<Search size={16} color=\"var(--text-dim)\" />\n              <input \n                type=\"text\" \n                placeholder=\"Search prompts...\"\n                value={adminSearch}\n                onChange={e => setAdminSearch(e.target.value)}\n                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.85rem', outline: 'none', flex: 1 }}\n              />\n            </div>";
const searchReplacement = searchTarget + `
            <select style={{...inputStyle, width: 'auto', padding: '8px 12px'}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="scheduled">Scheduled</option>
              <option value="hidden">Hidden</option>
            </select>
            <select style={{...inputStyle, width: 'auto', padding: '8px 12px'}} value={filterAccess} onChange={e => setFilterAccess(e.target.value)}>
              <option value="all">All Access</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
`;
if (!content.includes('value={filterStatus}')) {
  content = content.replace(searchTarget, searchReplacement);
}

// Update the filtering logic
const filterTarget = "const filteredData = data.filter(item => {";
const filterReplacement = `const filteredData = data.filter(item => {
    let match = true;
    if (view === 'prompts') {
      if (filterStatus === 'published') match = !item.is_draft && !(item.publish_date && new Date(item.publish_date) > new Date());
      else if (filterStatus === 'draft') match = !!item.is_draft;
      else if (filterStatus === 'scheduled') match = item.publish_date && new Date(item.publish_date) > new Date();
      else if (filterStatus === 'hidden') match = !!item.hide_prompt_box;

      if (match && filterAccess !== 'all') {
        if (filterAccess === 'pro') match = !!item.is_premium;
        else if (filterAccess === 'free') match = !item.is_premium;
      }
    }
    if (!match) return false;
`;
if (!content.includes('filterStatus === \'published\'')) {
  content = content.replace(filterTarget, filterReplacement);
}


// 9. Return Toaster and ContextMenu
if (!content.includes('<Toaster position')) {
  content = content.replace("return (\n    <div", "return (\n    <>\n      <Toaster position=\"bottom-right\" toastOptions={{ style: { background: '#1e1e24', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' } }} />\n      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} onAction={handleCommandAction} data={data} activeView={view} />\n      <ContextMenu {...contextMenu} onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))} actions={getContextMenuActions()} />\n    <div");
  content = content.replace("    </div>\n  );\n};\n\nexport default AdminDashboard;", "    </div>\n    </>\n  );\n};\n\nexport default AdminDashboard;");
}

// 10. Replace Alerts
const successKeywords = ['successful', 'applied', 'updated', 'saved', 'reset'];
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('alert(')) {
    let isSuccess = false;
    for (const kw of successKeywords) {
      if (lines[i].toLowerCase().includes(kw)) isSuccess = true;
    }
    
    if (lines[i].toLowerCase().includes('fail') || lines[i].toLowerCase().includes('error') || lines[i].toLowerCase().includes('cancelled') || lines[i].toLowerCase().includes('incorrect')) {
      isSuccess = false;
    }

    if (isSuccess) {
      lines[i] = lines[i].replace(/alert\(/g, 'toast.success(');
    } else {
      lines[i] = lines[i].replace(/alert\(/g, 'toast.error(');
    }
  }
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('AdminDashboard updated successfully.');
