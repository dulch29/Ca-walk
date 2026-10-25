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

// VisionCamera 5.2.3 generates recycle branches for views that do not implement
// RecyclableView. Kotlin 2.4 rejects those impossible `is` checks as errors.
const visionCameraManagers = [
  'HybridFrameRendererViewManager.kt',
  'HybridPreviewViewManager.kt',
].map((fileName) =>
  path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-vision-camera',
    'nitrogen',
    'generated',
    'android',
    'kotlin',
    'com',
    'margelo',
    'nitro',
    'camera',
    'views',
    fileName,
  ),
);

for (const managerFile of visionCameraManagers) {
  if (!fs.existsSync(managerFile)) {
    continue;
  }

  const managerSource = fs.readFileSync(managerFile, 'utf8');
  const managerPatched = managerSource.replace(
    /  protected override fun prepareToRecycleView\([\s\S]*?\n  \}\n\n  private fun getHybridViewHolder/,
    '  // Ca-Walk: this generated view does not implement RecyclableView.\n' +
      '  protected override fun prepareToRecycleView(reactContext: ThemedReactContext, view: View): View? {\n' +
      '    return null\n' +
      '  }\n\n  private fun getHybridViewHolder',
  );

  if (managerPatched !== managerSource) {
    fs.writeFileSync(managerFile, managerPatched);
  }
}
