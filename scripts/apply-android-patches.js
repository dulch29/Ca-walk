const fs = require('node:fs');
const path = require('node:path');

const gradleFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-sensors',
  'android',
  'build.gradle',
);

if (!fs.existsSync(gradleFile)) {
  process.exit(0);
}

const source = fs.readFileSync(gradleFile, 'utf8');
const patched = source
  .replace(/^\s*jcenter\(\)\s*\r?\n/gm, '')
  .replace(/\nbuildscript \{[\s\S]*?\n\}\n\napply plugin:/, '\napply plugin:');

if (patched !== source) {
  fs.writeFileSync(gradleFile, patched);
}
