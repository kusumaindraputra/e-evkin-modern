const fs = require('fs');

const filesToFix = [
  'src/components/ChatWidget.tsx',
  'src/components/LaporanDetail.tsx',
  'src/components/LaporanGroupCard.tsx',
  'src/components/LaporanInputCard.tsx',
  'src/components/Layout.tsx',
  'src/pages/AdminPuskesmasConfigPage.tsx',
  'src/pages/AdminTargetEditPage.tsx',
  'src/pages/DashboardPage.tsx',
  'src/pages/LoginPage.tsx',
  'src/pages/PuskesmasAngkasPage.tsx',
  'src/pages/PuskesmasDashboardPage.tsx',
  'src/pages/AdminTargetUploadPage.tsx',
  'src/pages/PuskesmasTargetKinerjaPage.tsx'
];

for (const file of filesToFix) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace `import { brand, xxx } from ...`
    // First, try replacing `brand, ` with nothing
    content = content.replace(/brand,\s*/g, '');
    
    // Then try replacing `, brand` with nothing
    content = content.replace(/,\s*brand/g, '');
    
    // Then try replacing just `{ brand }` with `{}` but ESLint might still complain if `{}` is left.
    // If it's `import { brand } from '../theme';`, the whole import isn't needed unless `theme` items exist.
    // Let's do a safer regex:
    // If import becomes `import { } from '../theme';`, remove it.
    content = content.replace(/import\s*\{\s*brand\s*\}\s*from\s*['"][^'"]+['"];?/g, '');
    
    // If it became empty braces
    content = content.replace(/import\s*\{\s*\}\s*from\s*['"][^'"]+['"];?/g, '');

    fs.writeFileSync(file, content);
    console.log(`Cleaned import in ${file}`);
  } catch (e) {
    if (e.code !== 'ENOENT') console.error(e);
  }
}
