/* Create an isolated production-build directory. Never builds in the checkout. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const destination = process.argv[2] ? path.resolve(process.argv[2]) : fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-profile-'));
if (destination === root || destination.startsWith(root + path.sep)) throw new Error('Use a destination outside the working checkout');
if (fs.existsSync(destination) && fs.readdirSync(destination).length) throw new Error('Destination must be empty');
fs.mkdirSync(destination, {
  recursive: true
});
for (const name of ['src', 'public', 'package.json', 'package-lock.json', 'next.config.js', 'tsconfig.json', 'next-env.d.ts', '.babelrc', '.eslintrc.json']) {
  fs.cpSync(path.join(root, name), path.join(destination, name), {
    recursive: true
  });
}
fs.symlinkSync(path.join(root, 'node_modules'), path.join(destination, 'node_modules'), 'dir');
const component = path.join(destination, 'src/components/hero/PostEffects.tsx');
let source = fs.readFileSync(component, 'utf8');
if (!source.includes('export const PostEffects = () => {') || !source.includes('<EffectComposer disableNormalPass')) throw new Error('Update diagnostic hook for changed PostEffects source');
source = source.replace('export const PostEffects = () => {', 'export const PostEffects = () => {\n    (window as any).__state = useThree();');
source = source.replace('<EffectComposer disableNormalPass', '<EffectComposer ref={(c) => { (window as any).__composer = c; }} disableNormalPass');
fs.writeFileSync(component, source);
const hashes = {};
function hashFiles(dir) {
  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true
  })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) hashFiles(file);else hashes[path.relative(destination, file)] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }
}
hashFiles(path.join(destination, 'src'));
fs.writeFileSync(path.join(destination, 'source-manifest.json'), JSON.stringify(hashes, null, 2));
console.log(destination);
