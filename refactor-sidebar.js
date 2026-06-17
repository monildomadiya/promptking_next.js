const fs = require('fs');
let c = fs.readFileSync('components/Prompts/CategorySidebar.jsx', 'utf8');

// Extract HighlightText
const highlightTextDef = `  const HighlightText = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) return <span>{text}</span>;
    const parts = String(text).split(new RegExp(\`(\${highlight.replace(/[-[\\]{}()*+?.,\\\\^$|#\\s]/g, '\\\\$&')})\`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? 
            <mark key={i} style={{ 
              background: 'rgba(229, 9, 20, 0.2)', 
              color: 'var(--accent-main)',
              padding: '0 2px',
              borderRadius: '4px',
              fontWeight: 800
            }}>{part}</mark> : part
        )}
      </span>
    );
  };`;

// Extract FilterGroup
const filterGroupDef = `  const FilterGroup = ({ title, children }) => (
    <div style={{ marginBottom: '30px' }}>
      <h4 style={{ 
        fontSize: '0.75rem', 
        fontWeight: 800, 
        color: 'var(--text-dim)', 
        textTransform: 'uppercase', 
        letterSpacing: '1.5px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {children}
      </div>
    </div>
  );`;

// Extract FilterItem
const filterItemDef = `  const FilterItem = ({ label, value, icon: Icon, count, onClick, to }) => {
    const Component = to ? Link : 'button';
    const linkProps = to ? { href: to } : {};
    return (
    <Component 
      {...linkProps}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: '12px',
        background: isActive(value) ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        border: '1px solid ' + (isActive(value) ? 'rgba(255, 255, 255, 0.1)' : 'transparent'),
        color: isActive(value) ? 'white' : 'var(--text-dim)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        textAlign: 'left',
        textDecoration: 'none'
      }}
      onMouseOver={(e) => {
        if (!isActive(value)) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
          e.currentTarget.style.color = 'white';
        }
      }}
      onMouseOut={(e) => {
        if (!isActive(value)) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-dim)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          border: '2px solid ' + (isActive(value) ? 'var(--accent-main)' : 'rgba(255, 255, 255, 0.2)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          background: isActive(value) ? 'var(--accent-main)' : 'transparent'
        }}>
          {isActive(value) && <CheckCircle size={12} color="white" />}
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: isActive(value) ? 600 : 500 }}>
          <HighlightText text={label} highlight={searchTerm} />
        </span>
      </div>
      {count !== undefined && (
        <span style={{ 
          fontSize: '0.75rem', 
          opacity: isActive(value) ? 1 : 0.5,
          fontWeight: 600,
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '2px 8px',
          borderRadius: '100px'
        }}>
          {count}
        </span>
      )}
    </Component>
    );
  };`;


const newHighlightText = `const HighlightText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) return <span>{text}</span>;
  const parts = String(text).split(new RegExp(\`(\${highlight.replace(/[-[\\]{}()*+?.,\\\\^$|#\\s]/g, '\\\\$&')})\`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? 
          <mark key={i} style={{ 
            background: 'rgba(229, 9, 20, 0.2)', 
            color: 'var(--accent-main)',
            padding: '0 2px',
            borderRadius: '4px',
            fontWeight: 800
          }}>{part}</mark> : part
      )}
    </span>
  );
};`;

const newFilterGroup = `const FilterGroup = ({ title, children }) => (
  <div style={{ marginBottom: '30px' }}>
    <h4 style={{ 
      fontSize: '0.75rem', 
      fontWeight: 800, 
      color: 'var(--text-dim)', 
      textTransform: 'uppercase', 
      letterSpacing: '1.5px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      {title}
    </h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {children}
    </div>
  </div>
);`;

const newFilterItem = `const FilterItem = ({ label, value, icon: Icon, count, onClick, to, isActive, searchTerm }) => {
  const Component = to ? Link : 'button';
  const linkProps = to ? { href: to } : {};
  return (
  <Component 
    {...linkProps}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      borderRadius: '12px',
      background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
      border: '1px solid ' + (isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'),
      color: isActive ? 'white' : 'var(--text-dim)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      width: '100%',
      textAlign: 'left',
      textDecoration: 'none'
    }}
    onMouseOver={(e) => {
      if (!isActive) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
        e.currentTarget.style.color = 'white';
      }
    }}
    onMouseOut={(e) => {
      if (!isActive) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-dim)';
      }
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        border: '2px solid ' + (isActive ? 'var(--accent-main)' : 'rgba(255, 255, 255, 0.2)'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        background: isActive ? 'var(--accent-main)' : 'transparent'
      }}>
        {isActive && <CheckCircle size={12} color="white" />}
      </div>
      <span style={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }}>
        <HighlightText text={label} highlight={searchTerm} />
      </span>
    </div>
    {count !== undefined && (
      <span style={{ 
        fontSize: '0.75rem', 
        opacity: isActive ? 1 : 0.5,
        fontWeight: 600,
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '2px 8px',
        borderRadius: '100px'
      }}>
        {count}
      </span>
    )}
  </Component>
  );
};`;

if (!c.includes(newFilterGroup)) {
  // Remove inner definitions
  c = c.replace(highlightTextDef, '');
  c = c.replace(filterGroupDef, '');
  c = c.replace(filterItemDef, '');

  // Add outer definitions
  c = c.replace('const CategorySidebar = ({ filter, setFilter, counts = {} }) => {', newHighlightText + '\\n\\n' + newFilterGroup + '\\n\\n' + newFilterItem + '\\n\\nconst CategorySidebar = ({ filter, setFilter, counts = {} }) => {');

  // Replace usages to pass isActive and searchTerm
  c = c.replace(/<FilterItem([\s\S]*?)\/>/g, (match, props) => {
    // extract value="..." if any
    const valMatch = match.match(/value="([^"]+)"/);
    if (valMatch) {
      const val = valMatch[1];
      return "<FilterItem" + props + " isActive={filter === '" + val + "'} searchTerm={searchTerm} />";
    }
    return match;
  });
  
  // also handle dynamic ones
  c = c.replace(/<FilterItem\s+key=\{cat\.id\}\s+label=\{cat\.name\}\s+value=\{catSlug\}\s+count=\{counts\[catSlug\]\}\s+onClick=\{\(\) => setFilter\(catSlug\)\}\s+\/>/g, "<FilterItem \n                key={cat.id} \n                label={cat.name} \n                value={catSlug} \n                count={counts[catSlug]} \n                onClick={() => setFilter(catSlug)} \n                isActive={filter === catSlug}\n                searchTerm={searchTerm}\n              />");
  
  fs.writeFileSync('components/Prompts/CategorySidebar.jsx', c);
  console.log("CategorySidebar Refactored!");
} else {
  console.log("Already Refactored!");
}
