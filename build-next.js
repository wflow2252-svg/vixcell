const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('--- Phase 1: Installing Next.js v2 Dependencies ---');
  execSync('npm install', { cwd: path.join(__dirname, 'v2'), stdio: 'inherit' });

  console.log('\n--- Phase 2: Compiling Next.js v2 static export ---');
  execSync('npm run build', { cwd: path.join(__dirname, 'v2'), stdio: 'inherit' });

  const srcDir = path.join(__dirname, 'v2', 'out');
  const destDir = path.join(__dirname, 'web', 'dist');

  console.log(`\n--- Phase 3: Cleaning old deploy folder at ${destDir} ---`);
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  console.log(`\n--- Phase 4: Copying Next.js static build from ${srcDir} to ${destDir} ---`);
  copyDirSync(srcDir, destDir);

  console.log('\n✅ Build pipeline completed successfully! Next.js is ready for Vercel deployment.');
} catch (error) {
  console.error('\n❌ Build pipeline failed:', error);
  process.exit(1);
}
