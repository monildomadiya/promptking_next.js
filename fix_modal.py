with open(r'd:\DJ Projects\promptking.in\client\src\components\Admin\AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = '  ];\n\n  return ('
new = (
    '  ];\n\n'
    '  // When editing/creating a prompt, render ONLY the modal as a full page.\n'
    '  // This removes the dashboard DOM from behind the modal so screenshot tools\n'
    '  // do not capture the fixed overlay multiple times over the scrollable dashboard.\n'
    '  if (isModalOpen && view === \'prompts\') {\n'
    '    return (\n'
    '      <>\n'
    '        <Toaster position="top-right" toastOptions={{ style: { background: \'#1a1a1a\', color: \'#fff\', border: \'1px solid rgba(255,255,255,0.1)\' } }} />\n'
    '        <PromptModal\n'
    '          prompt={editingItem}\n'
    '          onClose={() => setIsModalOpen(false)}\n'
    '          onSave={() => { setIsModalOpen(false); fetchData(view); }}\n'
    '        />\n'
    '      </>\n'
    '    );\n'
    '  }\n\n'
    '  return ('
)

if old in content:
    content = content.replace(old, new, 1)
    with open(r'd:\DJ Projects\promptking.in\client\src\components\Admin\AdminDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS')
else:
    print('NOT FOUND - old string not in file')
