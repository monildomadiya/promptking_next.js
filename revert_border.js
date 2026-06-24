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

  // Revert 2px solid to 1px solid for white glass borders
  content = content.replace(/2px\s+solid\s+rgba\(\s*255\s*,\s*255\s*,\s*255/g, '1px solid rgba(255, 255, 255');
  
  // Revert 2px solid to 1px solid for red accent glass borders
  content = content.replace(/2px\s+solid\s+rgba\(\s*229\s*,\s*9\s*,\s*20/g, '1px solid rgba(229, 9, 20');

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
