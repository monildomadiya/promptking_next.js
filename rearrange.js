const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'Layout', 'Header.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const searchBlockStart = content.indexOf('{/* Collapsible Search */}');
const searchBlockEnd = content.indexOf('<div className="header-actions"');

const actionsBlockStart = searchBlockEnd;
const actionsBlockEnd = content.indexOf('        </div>\n      </header>');

if (searchBlockStart !== -1 && actionsBlockEnd !== -1) {
  const searchBlock = content.slice(searchBlockStart, searchBlockEnd);
  // Remove the trailing spaces/newlines from actionsBlock so it ends exactly after its closing div
  let actionsBlock = content.slice(actionsBlockStart, actionsBlockEnd);
  
  // create the wrapper
  const wrapperStart = `
          {/* Right Side Group */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? (isSearchExpanded ? '0' : '8px') : '16px',
            marginLeft: 'auto',
            flex: isSearchExpanded ? 1 : 'none',
            justifyContent: 'flex-end'
          }}>
`;
  const wrapperEnd = `          </div>\n`;

  const newRightSide = wrapperStart + actionsBlock + searchBlock + wrapperEnd;

  const newContent = content.slice(0, searchBlockStart) + newRightSide + content.slice(actionsBlockEnd);
  
  // add max-width to the search bar
  const finalContent = newContent.replace(
      "width: isSearchExpanded ? '100%' : 'auto',",
      "width: isSearchExpanded ? '100%' : 'auto',\n            maxWidth: isSearchExpanded ? (isMobile ? 'none' : '400px') : 'none',"
  );

  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log("Successfully rearranged Header.jsx");
} else {
  console.log("Could not find blocks");
}
