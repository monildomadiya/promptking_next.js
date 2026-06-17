const fs = require('fs');
let c = fs.readFileSync('components/Prompts/CategoryBar.jsx', 'utf8');

const filterChipSrc = `  const FilterChip = ({ label, value, icon: Icon, count }) => (
    <button
      onClick={() => setFilter(isActive(value) ? 'all' : value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        borderRadius: '100px',
        background: isActive(value) ? 'var(--accent-main)' : 'rgba(255, 255, 255, 0.05)',
        border: '1px solid ' + (isActive(value) ? 'var(--accent-main)' : 'rgba(255, 255, 255, 0.1)'),
        color: isActive(value) ? 'white' : 'var(--text-dim)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: isActive(value) ? 700 : 600,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isActive(value) ? '0 8px 20px var(--accent-glow)' : 'none'
      }}
    >
      {Icon && <Icon size={14} color={isActive(value) ? 'white' : 'currentColor'} />}
      <span>{label}</span>
      {count !== undefined && (
        <span style={{ 
          fontSize: '0.7rem', 
          opacity: 0.6,
          background: isActive(value) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          padding: '2px 6px',
          borderRadius: '6px'
        }}>
          {count}
        </span>
      )}
    </button>
  );`;

const newFilterChip = `const FilterChip = ({ label, value, icon: Icon, count, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 18px',
      borderRadius: '100px',
      background: isActive ? 'var(--accent-main)' : 'rgba(255, 255, 255, 0.05)',
      border: '1px solid ' + (isActive ? 'var(--accent-main)' : 'rgba(255, 255, 255, 0.1)'),
      color: isActive ? 'white' : 'var(--text-dim)',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: isActive ? 700 : 600,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isActive ? '0 8px 20px var(--accent-glow)' : 'none'
    }}
  >
    {Icon && <Icon size={14} color={isActive ? 'white' : 'currentColor'} />}
    <span>{label}</span>
    {count !== undefined && (
      <span style={{ 
        fontSize: '0.7rem', 
        opacity: 0.6,
        background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
        padding: '2px 6px',
        borderRadius: '6px'
      }}>
        {count}
      </span>
    )}
  </button>
);`;

if (c.includes('const FilterChip')) {
  c = c.replace(filterChipSrc, '');
  c = c.replace('const CategoryBar = ({ filter, setFilter, categories, counts }) => {', newFilterChip + '\\n\\nconst CategoryBar = ({ filter, setFilter, categories, counts }) => {');

  // Replace usages manually via Regex or string ops
  c = c.replace(/<FilterChip([\s\S]*?)\/>/g, (match, props) => {
    const valMatch = match.match(/value="([^"]+)"/);
    if (valMatch) {
      const val = valMatch[1];
      return "<FilterChip" + props + " isActive={filter === '" + val + "'} onClick={() => setFilter(filter === '" + val + "' ? 'all' : '" + val + "')} />";
    }
    return match;
  });

  c = c.replace(/<FilterChip key=\{cat\.id\} label=\{cat\.name\} value=\{catSlug\} count=\{counts\[catSlug\]\} \/>/g, "<FilterChip key={cat.id} label={cat.name} value={catSlug} count={counts[catSlug]} isActive={filter === catSlug} onClick={() => setFilter(filter === catSlug ? 'all' : catSlug)} />");

  fs.writeFileSync('components/Prompts/CategoryBar.jsx', c);
  console.log("Refactored CategoryBar");
} else {
  console.log("Already Refactored");
}
