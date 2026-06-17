const fs = require('fs');
let c = fs.readFileSync('app/article/[slug]/ClientArticleDetail.jsx', 'utf8');

c = c.replace('const ArticlePage = () => {', 'const ClientArticleDetail = ({ initialBlog, initialOtherBlogs, initialCategories }) => {');
c = c.replace('const [blog, setBlog] = useState(null);', 'const [blog, setBlog] = useState(initialBlog || null);');
c = c.replace('const [otherBlogs, setOtherBlogs] = useState([]);', 'const [otherBlogs, setOtherBlogs] = useState(initialOtherBlogs || []);');
c = c.replace('const [categories, setCategories] = useState([]);', 'const [categories, setCategories] = useState(initialCategories || []);');
c = c.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(!initialBlog);');
c = c.replace('export default ArticlePage;', 'export default ClientArticleDetail;');

const targetEffect = /  useEffect\(\(\) => \{\s+fetchArticle\(\);\s+\}, \[slug\]\);/g;
const replaceEffect = `  useEffect(() => {
    if (!initialBlog || !initialCategories) {
      fetchArticle();
    }
  }, [slug, initialBlog, initialCategories]);`;
c = c.replace(targetEffect, replaceEffect);

fs.writeFileSync('app/article/[slug]/ClientArticleDetail.jsx', c);
console.log("Success");
