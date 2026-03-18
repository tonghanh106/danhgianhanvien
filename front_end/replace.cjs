const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

// Ensure move
if (fs.existsSync('src/components/Layout.tsx')) {
    fs.renameSync('src/components/Layout.tsx', 'src/components/layout/Layout.tsx');
}
if (fs.existsSync('src/components/Logo.tsx')) {
    fs.renameSync('src/components/Logo.tsx', 'src/components/layout/Logo.tsx');
}

replaceInFile('src/App.tsx', [[ /from '\.\/components\/Layout'/g, "from './components/layout/Layout'" ]]);
replaceInFile('src/components/layout/Layout.tsx', [[ /from '\.\.\/lib\/utils'/g, "from '../../utils/utils'" ]]);
replaceInFile('src/components/layout/Logo.tsx', [[ /from '\.\.\/lib\/utils'/g, "from '../../utils/utils'" ]]);

const pagesDir = 'src/pages';
if(fs.existsSync(pagesDir)) {
  const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
  for (const file of pages) {
    replaceInFile(path.join(pagesDir, file), [
      [ /from '\.\.\/lib\/utils'/g, "from '../utils/utils'" ],
      [ /from '\.\.\/components\/Logo'/g, "from '../components/layout/Logo'" ],
      [ /from '\.\.\/components\/Layout'/g, "from '../components/layout/Layout'" ]
    ]);
  }
}
console.log('Imports replaced successfully');
