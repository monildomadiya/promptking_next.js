const fs = require('fs');
let c = fs.readFileSync('app/prompt/[key]/ClientPromptDetail.jsx', 'utf8');

const targetEffect = `  useEffect(() => {
    // Only scroll to top if not returning via back button,
    // though App.jsx handles global scroll. This local scroll might interfere,
    // but we can leave it or just remove it since App.jsx handles it.
    // Let's remove window.scrollTo(0, 0) since App.jsx does it properly now.
    fetchPrompt();
    fetchSuggestions();
  }, [key]);`;

const replacementEffect = `  useEffect(() => {
    if (initialPrompt) {
      setIsUnlocked(!(initialPrompt.is_premium || initialPrompt.isPremium));
    } else {
      fetchPrompt();
    }
    
    if (!initialSuggestedPrompts || initialSuggestedPrompts.length === 0) {
      fetchSuggestions();
    }
  }, [key, initialPrompt, initialSuggestedPrompts]);`;

if (c.includes(targetEffect)) {
  c = c.replace(targetEffect, replacementEffect);
  fs.writeFileSync('app/prompt/[key]/ClientPromptDetail.jsx', c);
  console.log("Successfully updated useEffect.");
} else {
  console.log("Error: Target useEffect not found.");
}
