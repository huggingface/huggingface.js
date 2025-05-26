import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * A list of file extensions that we'll check for when evaluating relative imports
 * We only want to add .js suffix to our own TS files, not to CSS, JSON, etc.
 */
const TS_EXTENSIONS = new Set(['.ts', '.tsx']);

/**
 * Exclude node_modules and dist directories and any hidden directories starting with .
 */
const shouldIgnoreDirectory = (dir: string): boolean => {
  const basename = path.basename(dir);
  return basename === 'node_modules' || basename === 'dist' || basename.startsWith('.');
};

/**
 * Get all TypeScript files in a directory recursively
 */
async function getTypeScriptFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  
  const files: string[] = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (shouldIgnoreDirectory(fullPath)) {
        continue;
      }
      const subFiles = await getTypeScriptFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && TS_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Check if a file exists at the given path or with one of the TS extensions
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Process an import statement to add .js suffix if it's a relative import
 */
function processImport(importLine: string, basePath: string): string {
  // Match an import statement of the form import ... from '...';
  const regex = /from\s+['"]([^'"]+)['"]/;
  const match = importLine.match(regex);
  
  if (!match) {
    return importLine;
  }
  
  const importPath = match[1];
  
  // Skip if it's not a relative import (doesn't start with . or ..)
  if (!importPath.startsWith('.')) {
    return importLine;
  }
  
  // Skip if it already has a file extension
  if (path.extname(importPath) !== '') {
    return importLine;
  }
  
  // Add .js suffix
  const newImportPath = `${importPath}.js`;
  return importLine.replace(regex, `from '${newImportPath}'`);
}

/**
 * Process a TypeScript file to add .js suffix to all relative imports
 */
async function processFile(filePath: string, dryRun = false): Promise<boolean> {
  const content = await readFile(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  
  const newLines = lines.map(line => {
    // Skip lines that don't include an import statement
    if (!line.includes('import') || !line.includes('from')) {
      return line;
    }
    
    const newLine = processImport(line, path.dirname(filePath));
    
    if (newLine !== line) {
      modified = true;
    }
    
    return newLine;
  });
  
  if (modified && !dryRun) {
    await writeFile(filePath, newLines.join('\n'));
    console.log(`Updated: ${filePath}`);
  } else if (modified) {
    console.log(`Would update: ${filePath} (dry run)`);
  }
  
  return modified;
}

/**
 * Main function to process all TypeScript files in the specified directories or individual files
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const paths = args.filter(arg => !arg.startsWith('--'));
  
  // Default to processing the packages directory if no paths are provided
  const dirsToProcess = paths.length > 0 ? paths : ['packages'];
  
  let totalModified = 0;
  let totalFiles = 0;
  
  for (const inputPath of dirsToProcess) {
    try {
      const stats = await stat(inputPath);
      
      if (stats.isDirectory()) {
        console.log(`Processing directory: ${inputPath}`);
        const files = await getTypeScriptFiles(inputPath);
        totalFiles += files.length;
        
        console.log(`Found ${files.length} TypeScript files in ${inputPath}`);
        
        for (const file of files) {
          const modified = await processFile(file, dryRun);
          if (modified) {
            totalModified++;
          }
        }
      } else if (stats.isFile() && TS_EXTENSIONS.has(path.extname(inputPath))) {
        console.log(`Processing file: ${inputPath}`);
        totalFiles += 1;
        const modified = await processFile(inputPath, dryRun);
        if (modified) {
          totalModified++;
        }
      } else {
        console.log(`Skipping ${inputPath} (not a TypeScript file)`);
      }
    } catch (error) {
      console.error(`Error processing ${inputPath}:`, error);
    }
  }
  
  console.log(`\nSummary:`);
  console.log(`- Total files processed: ${totalFiles}`);
  console.log(`- Files modified: ${totalModified}`);
  
  if (dryRun) {
    console.log(`This was a dry run. No files were actually modified.`);
  }
}

// Execute the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});