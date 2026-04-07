const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend/src');

const brandMap = {
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
  primary: "var(--color-primary)",
  primaryLight: "var(--color-primary-light)",
  primaryDark: "var(--color-primary-dark)",
  accent: "var(--color-accent)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textTertiary: "var(--text-tertiary)",
  bgLayout: "var(--bg-layout)",
  bgCard: "var(--bg-card)",
  borderLight: "var(--border-light)",
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      if (file === 'theme.ts') continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Handle template literals using ${brand.xxx} first
      const templateRegex = /\$\{brand\.([a-zA-Z]+)\}/g;
      content = content.replace(templateRegex, (match, p1) => {
        if (brandMap[p1]) {
          modified = true;
          // In template literal, css var interpolation can be just the var call
          return brandMap[p1]; 
        }
        return match;
      });

      // Simple regex to find brand.xxx 
      const regex = /brand\.([a-zA-Z]+)/g;
      content = content.replace(regex, (match, p1) => {
        if (brandMap[p1]) {
          modified = true;
          return `'${brandMap[p1]}'`;
        }
        return match;
      });

      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
