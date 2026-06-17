const fs = require('fs');
let c = fs.readFileSync('app/faq/ClientFAQ.jsx', 'utf8');

c = c.replace('const FAQPage = () => {', 'const ClientFAQ = ({ initialFaqs }) => {');
c = c.replace('const [faqs, setFaqs] = useState([]);', 'const [faqs, setFaqs] = useState(initialFaqs || []);');
c = c.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(!initialFaqs);');
c = c.replace('export default FAQPage;', 'export default ClientFAQ;');

const targetEffect = /  useEffect\(\(\) => \{\s+fetchFaqs\(\);\s+\}, \[\]\);/g;
const replaceEffect = `  useEffect(() => {
    if (!initialFaqs || initialFaqs.length === 0) {
      fetchFaqs();
    }
  }, [initialFaqs]);`;
c = c.replace(targetEffect, replaceEffect);

fs.writeFileSync('app/faq/ClientFAQ.jsx', c);
console.log("FAQ Updated!");
