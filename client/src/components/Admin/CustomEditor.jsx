import React, { useRef, useEffect, useState } from 'react';

const CustomEditor = ({ value, onChange }) => {
  const contentRef = useRef(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const savedRange = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      const current = contentRef.current.innerHTML;
      const newVal = value || '';
      if (current !== newVal) {
        contentRef.current.innerHTML = newVal;
      }
    }
  }, [value]);

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreRange = () => {
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    contentRef.current?.focus();
  };

  const exec = (cmd, val = null) => {
    contentRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(contentRef.current?.innerHTML || '');
  };

  const insertHTML = (html) => {
    contentRef.current?.focus();
    if (savedRange.current) {
      restoreRange();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const fragment = range.createContextualFragment(html);
        range.insertNode(fragment);
        range.collapse(false);
      }
    } else {
      document.execCommand('insertHTML', false, html);
    }
    onChange(contentRef.current?.innerHTML || '');
  };

  const handleInput = () => onChange(contentRef.current?.innerHTML || '');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertParagraph', false);
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); exec('bold'); }
      if (e.key === 'i') { e.preventDefault(); exec('italic'); }
      if (e.key === 'u') { e.preventDefault(); exec('underline'); }
      if (e.key === 'z') { e.preventDefault(); exec('undo'); }
      if (e.key === 'y') { e.preventDefault(); exec('redo'); }
    }
  };

  // YouTube URL to embed ID
  const getYoutubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleYoutubeEmbed = () => {
    const id = getYoutubeId(youtubeUrl);
    if (!id) { alert('Invalid YouTube URL'); return; }
    const html = `<div class="yt-embed-wrap" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:20px 0;"><iframe src="https://www.youtube.com/embed/${id}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:12px;" allowfullscreen loading="lazy"></iframe></div><p></p>`;
    restoreRange();
    insertHTML(html);
    setYoutubeUrl('');
    setShowYoutubeModal(false);
  };

  const handleImageEmbed = () => {
    if (!imageUrl.trim()) return;
    const html = `<img src="${imageUrl.trim()}" alt="Image" style="max-width:100%;height:auto;border-radius:12px;margin:12px 0;display:block;" /><p></p>`;
    restoreRange();
    insertHTML(html);
    setImageUrl('');
    setShowImageModal(false);
  };

  const handleInsertTable = () => {
    const r = parseInt(tableRows) || 3;
    const c = parseInt(tableCols) || 3;
    let html = `<table class="editor-table"><thead><tr>`;
    for (let i = 0; i < c; i++) html += `<th>Header ${i+1}</th>`;
    html += `</tr></thead><tbody>`;
    for (let i = 0; i < r - 1; i++) {
      html += `<tr>`;
      for (let j = 0; j < c; j++) html += `<td>Cell</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table><p></p>`;
    restoreRange();
    insertHTML(html);
    setShowTableModal(false);
  };

  const insertCodeBlock = () => {
    const html = `<pre class="editor-codeblock"><code>// Your code here</code></pre><p></p>`;
    insertHTML(html);
  };

  const insertBlockquote = () => {
    exec('formatBlock', 'blockquote');
  };

  const Divider = () => <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>

      {/* === TOOLBAR === */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>

        {/* Undo / Redo */}
        <Btn onClick={() => exec('undo')} title="Undo (Ctrl+Z)">↩</Btn>
        <Btn onClick={() => exec('redo')} title="Redo (Ctrl+Y)">↪</Btn>
        <Divider />

        {/* Block format */}
        <select
          onChange={(e) => { exec('formatBlock', e.target.value); e.target.value = ''; }}
          defaultValue=""
          style={{ padding: '5px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.82rem', cursor: 'pointer' }}
        >
          <option value="" disabled>Format</option>
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        {/* Font size */}
        <select
          onChange={(e) => { exec('fontSize', e.target.value); e.target.value = ''; }}
          defaultValue=""
          style={{ padding: '5px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.82rem', cursor: 'pointer' }}
        >
          <option value="" disabled>Size</option>
          {[1,2,3,4,5,6,7].map(s => <option key={s} value={s}>Size {s}</option>)}
        </select>
        <Divider />

        {/* Style */}
        <Btn onClick={() => exec('bold')} title="Bold (Ctrl+B)"><strong>B</strong></Btn>
        <Btn onClick={() => exec('italic')} title="Italic (Ctrl+I)"><em>I</em></Btn>
        <Btn onClick={() => exec('underline')} title="Underline (Ctrl+U)"><u>U</u></Btn>
        <Btn onClick={() => exec('strikeThrough')} title="Strikethrough"><s>S</s></Btn>
        <Divider />

        {/* Text Color */}
        <label title="Text Color" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
          A
          <input type="color" defaultValue="#ffffff" onChange={(e) => exec('foreColor', e.target.value)}
            style={{ width: '22px', height: '22px', border: 'none', padding: 0, background: 'none', cursor: 'pointer', borderRadius: '4px' }} />
        </label>
        <Divider />

        {/* Align */}
        <Btn onClick={() => exec('justifyLeft')} title="Align Left">≡L</Btn>
        <Btn onClick={() => exec('justifyCenter')} title="Center">≡C</Btn>
        <Btn onClick={() => exec('justifyRight')} title="Align Right">≡R</Btn>
        <Divider />

        {/* Lists */}
        <Btn onClick={() => exec('insertUnorderedList')} title="Bullet List">• List</Btn>
        <Btn onClick={() => exec('insertOrderedList')} title="Numbered List">1. List</Btn>
        <Divider />

        {/* Blockquote & Code */}
        <Btn onClick={insertBlockquote} title="Blockquote">" Quote</Btn>
        <Btn onClick={insertCodeBlock} title="Code Block">&lt;/&gt; Code</Btn>
        <Divider />

        {/* Link */}
        <Btn onClick={() => {
          saveRange();
          const url = window.prompt('Enter URL (include https://):');
          if (url) { restoreRange(); exec('createLink', url); }
        }} title="Insert Link">🔗 Link</Btn>
        <Btn onClick={() => exec('unlink')} title="Remove Link">Unlink</Btn>
        <Divider />

        {/* Image */}
        <Btn onClick={() => { saveRange(); setShowImageModal(true); }} title="Insert Image">🖼 Image</Btn>

        {/* Table */}
        <Btn onClick={() => { saveRange(); setShowTableModal(true); }} title="Insert Table">⊞ Table</Btn>

        {/* YouTube */}
        <Btn onClick={() => { saveRange(); setShowYoutubeModal(true); }} title="Embed YouTube">▶ YouTube</Btn>
        <Divider />

        {/* Clear */}
        <Btn onClick={() => exec('removeFormat')} title="Clear Formatting">✕ Clear</Btn>
      </div>

      {/* === CONTENT AREA === */}
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        className="custom-editor-content"
        data-placeholder="Start writing..."
        style={{ minHeight: '420px', padding: '20px 24px', outline: 'none', color: 'white', fontSize: '1rem', lineHeight: '1.8', background: 'rgba(255,255,255,0.01)', overflowY: 'auto' }}
      />

      {/* === STYLES === */}
      <style>{`
        .custom-editor-content:empty:before { content: attr(data-placeholder); color: rgba(255,255,255,0.25); pointer-events: none; display: block; }
        .custom-editor-content p { margin-bottom: 0.9em; }
        .custom-editor-content h2 { font-size: 1.6rem; font-weight: 800; color: var(--accent-main); margin: 1.4em 0 0.5em; }
        .custom-editor-content h3 { font-size: 1.3rem; font-weight: 700; color: #fff; margin: 1.2em 0 0.4em; }
        .custom-editor-content h4 { font-size: 1.1rem; font-weight: 700; color: rgba(255,255,255,0.85); margin: 1em 0 0.4em; }
        .custom-editor-content ul { list-style: disc; margin-left: 2em; margin-bottom: 1em; }
        .custom-editor-content ol { list-style: decimal; margin-left: 2em; margin-bottom: 1em; }
        .custom-editor-content li { margin-bottom: 0.4em; }
        .custom-editor-content a { color: var(--accent-main); text-decoration: underline; }
        .custom-editor-content blockquote { border-left: 4px solid var(--accent-main); margin: 1em 0; padding: 10px 20px; background: rgba(229,9,20,0.06); border-radius: 0 10px 10px 0; color: rgba(255,255,255,0.75); font-style: italic; }
        .custom-editor-content .editor-codeblock { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 16px 20px; font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 0.9rem; color: #a8ff78; margin: 1em 0; overflow-x: auto; white-space: pre; }
        .custom-editor-content .editor-table { width: 100%; border-collapse: collapse; margin: 1em 0; border-radius: 10px; overflow: hidden; }
        .custom-editor-content .editor-table th { background: rgba(229,9,20,0.15); color: white; font-weight: 700; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); text-align: left; }
        .custom-editor-content .editor-table td { padding: 9px 14px; border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
        .custom-editor-content .editor-table tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
        .custom-editor-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 12px 0; display: block; }
        .custom-editor-content .yt-embed-wrap iframe { border-radius: 12px; }
      `}</style>

      {/* === YOUTUBE MODAL === */}
      {showYoutubeModal && (
        <EditorModal title="▶ Embed YouTube Video" onClose={() => setShowYoutubeModal(false)}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '12px' }}>Paste a YouTube video URL below.</p>
          <input
            autoFocus
            type="text"
            placeholder="https://youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleYoutubeEmbed()}
            className="glass-input"
            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '14px' }}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <ModalBtn secondary onClick={() => setShowYoutubeModal(false)}>Cancel</ModalBtn>
            <ModalBtn onClick={handleYoutubeEmbed}>Embed Video</ModalBtn>
          </div>
        </EditorModal>
      )}

      {/* === IMAGE MODAL === */}
      {showImageModal && (
        <EditorModal title="🖼 Insert Image" onClose={() => setShowImageModal(false)}>
          <input
            autoFocus
            type="text"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleImageEmbed()}
            className="glass-input"
            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '14px' }}
          />
          {imageUrl && <img src={imageUrl} alt="preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '14px' }} onError={e => e.target.style.display='none'} />}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <ModalBtn secondary onClick={() => setShowImageModal(false)}>Cancel</ModalBtn>
            <ModalBtn onClick={handleImageEmbed}>Insert</ModalBtn>
          </div>
        </EditorModal>
      )}

      {/* === TABLE MODAL === */}
      {showTableModal && (
        <EditorModal title="⊞ Insert Table" onClose={() => setShowTableModal(false)}>
          <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Rows</label>
              <input type="number" min="1" max="20" value={tableRows} onChange={e => setTableRows(e.target.value)}
                className="glass-input" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Columns</label>
              <input type="number" min="1" max="10" value={tableCols} onChange={e => setTableCols(e.target.value)}
                className="glass-input" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <ModalBtn secondary onClick={() => setShowTableModal(false)}>Cancel</ModalBtn>
            <ModalBtn onClick={handleInsertTable}>Insert Table</ModalBtn>
          </div>
        </EditorModal>
      )}
    </div>
  );
};

// Toolbar Button
const Btn = ({ children, onClick, title }) => (
  <button type="button" title={title} onClick={(e) => { e.preventDefault(); onClick(); }}
    style={{ padding: '5px 11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: '0.15s', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,9,20,0.2)'; e.currentTarget.style.borderColor = 'rgba(229,9,20,0.4)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
  >{children}</button>
);

// Modal Wrapper
const EditorModal = ({ title, children, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
    <div style={{ background: 'rgba(12,12,16,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px 32px', width: '100%', maxWidth: '480px', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '18px', color: 'white' }}>{title}</h3>
      {children}
    </div>
  </div>
);

// Modal Button
const ModalBtn = ({ children, onClick, secondary }) => (
  <button type="button" onClick={onClick}
    style={{ padding: '10px 22px', borderRadius: '10px', border: secondary ? '1px solid rgba(255,255,255,0.1)' : 'none', background: secondary ? 'rgba(255,255,255,0.05)' : 'var(--accent-main)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: '0.2s' }}
  >{children}</button>
);

export default CustomEditor;
