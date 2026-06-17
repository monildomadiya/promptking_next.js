const fs = require('fs');

function moveUseEffectBelow(file, funcName) {
  let c = fs.readFileSync(file, 'utf8');
  
  // Find useEffect block
  const effectRegex = new RegExp(`  useEffect\\(\\(\\) => \\{[\\s\\S]*?${funcName}\\(\\);[\\s\\S]*?\\}, \\[[^\\]]*\\]\\);\\n`, 'g');
  const match = effectRegex.exec(c);
  if (!match) return;
  
  const effectBlock = match[0];
  
  // Remove the useEffect block
  c = c.replace(effectBlock, '');
  
  // Find the end of the function
  const funcRegex = new RegExp(`(?:const ${funcName} = async \\(\\) => \\{|async function ${funcName}\\(\\) \\{)[\\s\\S]*?\\n  };\\n`, 'g');
  const match2 = funcRegex.exec(c);
  if (!match2) return;
  
  const funcBlock = match2[0];
  
  // Insert useEffect after the function
  c = c.replace(funcBlock, funcBlock + '\n' + effectBlock);
  
  fs.writeFileSync(file, c);
}

moveUseEffectBelow('app/blog/page.jsx', 'fetchBlogs');
moveUseEffectBelow('app/faq/ClientFAQ.jsx', 'fetchFaqs');
moveUseEffectBelow('app/article/[slug]/ClientArticleDetail.jsx', 'fetchArticle');

console.log('Moved useEffects below fetch functions');
