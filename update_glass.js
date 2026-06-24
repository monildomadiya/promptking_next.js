const fs = require('fs');
const path = require('path');

const dirs = [
  'd:/DJ Projects/promptking.in/app',
  'd:/DJ Projects/promptking.in/components'
];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.css') || dirPath.endsWith('.js') || dirPath.endsWith('.jsx')) {
        callback(dirPath);
      }
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // First, replace 1px solid with 2px solid for faint white glass borders
  content = content.replace(/1px\s+solid\s+rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.0[1-9]\s*\)/g, match => {
    return match.replace('1px', '2px');
  });

  // Then map the opacities
  const mapping = {
    '0.01': '0.04',
    '0.02': '0.08',
    '0.03': '0.1',
    '0.04': '0.12',
    '0.05': '0.15',
    '0.06': '0.2',
    '0.07': '0.22',
    '0.08': '0.25',
    '0.09': '0.28'
  };

  content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(0\.0[1-9])\s*\)/g, (match, p1) => {
    const newOpacity = mapping[p1];
    if (newOpacity) {
      return match.replace(p1, newOpacity);
    }
    return match;
  });

  // Do the same for red accent color faint glass: rgba(229, 9, 20, 0.0x)
  content = content.replace(/1px\s+solid\s+rgba\(\s*229\s*,\s*9\s*,\s*20\s*,\s*0\.0[1-9]\s*\)/g, match => {
    return match.replace('1px', '2px');
  });

  content = content.replace(/rgba\(\s*229\s*,\s*9\s*,\s*20\s*,\s*(0\.0[1-9])\s*\)/g, (match, p1) => {
    const newOpacity = mapping[p1];
    if (newOpacity) {
      return match.replace(p1, newOpacity);
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, processFile);
  }
});

console.log('Done.');
