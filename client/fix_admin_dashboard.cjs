const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Admin', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Advanced Filters
const filterTarget = "const filteredData = Array.isArray(data) ? data.filter(item => {\\n    if (!adminSearch) return true;";
const filterReplacement = `const filteredData = Array.isArray(data) ? data.filter(item => {
    let match = true;
    if (view === 'prompts') {
      if (filterStatus === 'published') match = !item.is_draft && !(item.publish_date && new Date(item.publish_date) > new Date()) && !item.hide_prompt_box;
      else if (filterStatus === 'draft') match = !!item.is_draft;
      else if (filterStatus === 'scheduled') match = item.publish_date && new Date(item.publish_date) > new Date();
      else if (filterStatus === 'hidden') match = !!item.hide_prompt_box;

      if (match && filterAccess !== 'all') {
        if (filterAccess === 'pro') match = !!item.is_premium;
        else if (filterAccess === 'free') match = !item.is_premium;
      }
    }
    if (!match) return false;

    if (!adminSearch) return true;`;

if (!content.includes('if (filterStatus === \'published\')')) {
  // Use regex because there might be varying whitespaces
  content = content.replace(/const filteredData = Array\.isArray\(data\) \? data\.filter\(item => \{\s*if \(\!adminSearch\) return true;/g, filterReplacement);
}

// 2. Fix Context Menu on motion.tr
const trTarget = "<motion.tr key={idx} variants={itemVariants} initial=\"hidden\" animate=\"visible\" exit=\"hidden\" custom={idx} style=";
const trReplacement = "<motion.tr key={idx} variants={itemVariants} initial=\"hidden\" animate=\"visible\" exit=\"hidden\" custom={idx} onContextMenu={(e) => handleContextMenu(e, item)} style=";

if (!content.includes('onContextMenu={(e) => handleContextMenu(e, item)}')) {
  content = content.replace(trTarget, trReplacement);
}

fs.writeFileSync(filePath, content);
console.log('Fixed AdminDashboard.jsx');
