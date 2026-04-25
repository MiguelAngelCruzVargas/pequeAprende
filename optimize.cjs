const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk(dir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove backdrop-blur-* classes
    content = content.replace(/backdrop-blur-(sm|md|lg|xl|2xl|3xl|\[.*?\])/g, '');
    
    // Replace repeat: Infinity with nothing or repeat: 0 to stop infinite loops
    content = content.replace(/,\s*repeat:\s*Infinity/g, '');
    content = content.replace(/repeat:\s*Infinity\s*,?/g, '');

    // Some specific heavy shadows
    content = content.replace(/shadow-\[inset_[^\]]+\]/g, 'shadow-md');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Optimized: ${filePath}`);
    }
  }
});
