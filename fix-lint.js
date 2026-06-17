const fs = require('fs');

// Fix app/blog/page.jsx
let c = fs.readFileSync('app/blog/page.jsx', 'utf8');
c = c.replace(/const fetchBlogs = async \(\) => {/g, 'async function fetchBlogs() {');
fs.writeFileSync('app/blog/page.jsx', c);

// Fix app/faq/ClientFAQ.jsx
c = fs.readFileSync('app/faq/ClientFAQ.jsx', 'utf8');
c = c.replace(/const fetchFaqs = async \(\) => {/g, 'async function fetchFaqs() {');
fs.writeFileSync('app/faq/ClientFAQ.jsx', c);

// Replace Date.now() during render with a static fallback or inside useEffect
function removeDateNow(file) {
  let content = fs.readFileSync(file, 'utf8');
  // Replaces " || Date.now()" with " || new Date().getTime()" or simply remove it.
  // Actually, if blog.published_at is null, just fallback to empty string or valid static date.
  content = content.replace(/\|\| Date\.now\(\)/g, "|| '2024-01-01'");
  fs.writeFileSync(file, content);
}

removeDateNow('app/article/[slug]/ClientArticleDetail.jsx');
removeDateNow('app/blog/page.jsx');

console.log('Fixed lint errors');
