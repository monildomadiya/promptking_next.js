const fs = require('fs');
let c = fs.readFileSync('components/Prompts/PromptCard.jsx', 'utf8');

c = c.replace(
  /\}, 400\); \/\/ Wait for open\/unlock animation\s+\}\s+\}, \[isUnlocked\]\);/,
  "}, 400); // Wait for open/unlock animation\\n    }\\n  }, [isUnlocked, prompt.isPremium, prompt.key]);"
);

fs.writeFileSync('components/Prompts/PromptCard.jsx', c);
console.log("Updated PromptCard.jsx dependencies");
