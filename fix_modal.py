with open(r'd:\DJ Projects\promptking.in\client\src\components\Admin\AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the menuGroups closing and the main AdminDashboard return
# The unique pattern is menuGroups end + return ( of AdminDashboard
old = (
    "    ]}\n"
    "  ];\n"
    "\n"
    "  return (\n"
    "    <div style={{ \n"
    "      display: 'flex', \n"
    "      flexDirection: isMobile ? 'column' : 'row',\n"
    "      minHeight: '100vh', \n"
    "      color: 'white',\n"
    "      overflowX: 'hidden'\n"
    "    }}>"
)

new = (
    "    ]}\n"
    "  ];\n"
    "\n"
    "  // When PromptModal is open, render ONLY the modal as a full page\n"
    "  // (no dashboard content behind it) so screenshot tools don't repeat it.\n"
    "  if (isModalOpen && view === 'prompts') {\n"
    "    return (\n"
    "      <>\n"
    "        <Toaster position=\"top-right\" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />\n"
    "        <PromptModal\n"
    "          prompt={editingItem}\n"
    "          onClose={() => setIsModalOpen(false)}\n"
    "          onSave={() => { setIsModalOpen(false); fetchData(view); }}\n"
    "        />\n"
    "      </>\n"
    "    );\n"
    "  }\n"
    "\n"
    "  return (\n"
    "    <div style={{ \n"
    "      display: 'flex', \n"
    "      flexDirection: isMobile ? 'column' : 'row',\n"
    "      minHeight: '100vh', \n"
    "      color: 'white',\n"
    "      overflowX: 'hidden'\n"
    "    }}>"
)

if old in content:
    content = content.replace(old, new, 1)
    with open(r'd:\DJ Projects\promptking.in\client\src\components\Admin\AdminDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS')
else:
    # Debug: show what's actually at that location
    idx = content.find("  ];\n\n  return (")
    if idx >= 0:
        print("Found alternative pattern at index:", idx)
        print(repr(content[idx:idx+200]))
    else:
        print("Pattern not found at all")
