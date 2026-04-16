import React, { useRef, useEffect } from 'react';

const CustomEditor = ({ value, onChange }) => {
  const contentEditableRef = useRef(null);

  useEffect(() => {
    // Basic sync: only set innerHTML if it's different to prevent resetting cursor
    if (contentEditableRef.current && contentEditableRef.current.innerHTML !== value) {
        // Handle undefined or null value
        const valToSet = value || '';
        // Also handle the edge case where contentEditable automatically inserts <br>
        if (contentEditableRef.current.innerHTML !== valToSet) {
            contentEditableRef.current.innerHTML = valToSet;
        }
    }
  }, [value]);

  const execCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    if (contentEditableRef.current) {
        contentEditableRef.current.focus();
        onChange(contentEditableRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (contentEditableRef.current) {
        onChange(contentEditableRef.current.innerHTML);
    }
  };

  // Keyboard shortcuts and special behaviors (like preventing default DIV insertion on enter)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        // execCommand 'insertParagraph' often creates <p> safely
        e.preventDefault();
        document.execCommand('insertParagraph', false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Editor Toolbar */}
      <div 
        style={{ 
          padding: '10px 15px', 
          background: 'rgba(255,255,255,0.05)', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <ToolbarButton onClick={() => execCommand('formatBlock', 'H2')} title="Heading 2">H2</ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', 'H3')} title="Heading 3">H3</ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', 'P')} title="Paragraph">P</ToolbarButton>
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }} />
        
        <ToolbarButton onClick={() => execCommand('bold')} title="Bold"><strong>B</strong></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('italic')} title="Italic"><em>I</em></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('underline')} title="Underline"><u>U</u></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('strikeThrough')} title="Strikethrough"><s>S</s></ToolbarButton>
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }} />

        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Bullet List">• List</ToolbarButton>
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Numbered List">1. List</ToolbarButton>
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }} />
        
        <ToolbarButton onClick={() => {
          const url = prompt('Enter URL:');
          if (url) execCommand('createLink', url);
        }} title="Insert Link">Link</ToolbarButton>
        <ToolbarButton onClick={() => execCommand('unlink')} title="Remove Link">Unlink</ToolbarButton>
        <ToolbarButton onClick={() => execCommand('removeFormat')} title="Clear Formatting">Clear</ToolbarButton>
      </div>

      {/* Editable Content Area */}
      <div 
        ref={contentEditableRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        className="custom-editor-content glass-input"
        style={{
          flex: 1,
          padding: '20px',
          minHeight: '400px',
          overflowY: 'auto',
          outline: 'none',
          border: 'none',
          color: 'white',
          fontSize: '1rem',
          lineHeight: '1.6',
          fontFamily: 'inherit',
          background: 'transparent'
        }}
        placeholder="Start writing..."
      />
      {/* Basic styles for the editable content elements to ensure they look good */}
      <style>{`
        .custom-editor-content p { margin-bottom: 1em; }
        .custom-editor-content h2 { margin-top: 1.5em; margin-bottom: 0.5em; font-size: 1.5rem; font-weight: 800; color: var(--accent-main); }
        .custom-editor-content h3 { margin-top: 1.2em; margin-bottom: 0.5em; font-size: 1.25rem; font-weight: 700; color: #fff; }
        .custom-editor-content ul { list-style-type: disc; margin-left: 2em; margin-bottom: 1em; }
        .custom-editor-content ol { list-style-type: decimal; margin-left: 2em; margin-bottom: 1em; }
        .custom-editor-content li { margin-bottom: 0.5em; }
        .custom-editor-content a { color: var(--accent-main); text-decoration: underline; }
        .custom-editor-content a:hover { color: #fff; }
        .custom-editor-content:empty:before {
            content: attr(placeholder);
            color: rgba(255, 255, 255, 0.3);
            pointer-events: none;
            display: block; // For Firefox
        }
      `}</style>
    </div>
  );
};

// Toolbar Button Component
const ToolbarButton = ({ children, onClick, title }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault(); // Prevent form submission
      onClick();
    }}
    title={title}
    style={{
      padding: '6px 12px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '600',
      transition: '0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
  >
    {children}
  </button>
);

export default CustomEditor;
