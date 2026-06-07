const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'components', 'Admin');

function replaceAlerts(filename) {
  const filePath = path.join(adminDir, filename);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Add imports
  if (!content.includes('react-hot-toast')) {
    if (content.includes("import { motion, AnimatePresence } from 'framer-motion';")) {
      content = content.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\nimport toast, { Toaster } from 'react-hot-toast';");
    } else {
      content = content.replace("import React", "import toast from 'react-hot-toast';\nimport React");
    }
  }

  // Add <Toaster /> inside the return statement of AdminDashboard
  if (filename === 'AdminDashboard.jsx' && !content.includes('<Toaster')) {
    content = content.replace("return (", "return (\n    <>\n      <Toaster position=\"bottom-right\" toastOptions={{ style: { background: '#1e1e24', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' } }} />");
    // Also need to close the fragment at the end of AdminDashboard
    content = content.replace("    </div>\n  );\n};\n\nexport default AdminDashboard;", "    </div>\n    </>\n  );\n};\n\nexport default AdminDashboard;");
  }

  // Replace alerts
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
  console.log('Done replacing alerts in ' + filename);
}

const files = fs.readdirSync(adminDir);
for (const file of files) {
  if (file.endsWith('.jsx')) {
    replaceAlerts(file);
  }
}
