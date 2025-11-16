// Security test file to check for potential security issues
const fs = require('fs');
const path = require('path');

// Function to read all files in a directory recursively
const readFilesRecursively = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (file !== 'node_modules' && !file.startsWith('.')) {
        readFilesRecursively(filePath, fileList);
      }
    } else {
      // Only check JavaScript, TypeScript, and JSON files
      if (/\.(js|jsx|ts|tsx|json)$/.test(file)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
};

describe('Security Tests', () => {
  it('should not expose any API keys or secrets in source code', () => {
    const srcDir = path.join(__dirname, '..');
    const files = readFilesRecursively(srcDir);
    
    // Patterns to look for (common patterns for API keys and secrets)
    const sensitivePatterns = [
      /api[_-]?key[\s=:]+['"][^\s'"]+['"]/i,
      /secret[\s=:]+['"][^\s'"]+['"]/i,
      /token[\s=:]+['"][^\s'"]+['"]/i,
      /password[\s=:]+['"][^\s'"]+['"]/i,
      /auth[\s=:]+['"][^\s'"]+['"]/i
    ];
    
    const violations = [];
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Skip test files and node modules
        if (file.includes('__tests__') || file.includes('node_modules')) {
          return;
        }
        
        sensitivePatterns.forEach(pattern => {
          if (pattern.test(content)) {
            const matches = content.match(pattern);
            violations.push({
              file: path.relative(process.cwd(), file),
              match: matches ? matches[0] : 'Unknown match'
            });
          }
        });
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    });
    
    if (violations.length > 0) {
      const violationMessages = violations.map(v => 
        `• ${v.file}: ${v.match}`
      ).join('\n');
      
      throw new Error(`\nPotential security issues found (${violations.length}):\n${violationMessages}\n\n` +
        'Please remove or properly secure any sensitive information.');
    }
  });
});
