const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'];
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Handle directory imports (e.g. './Context' → './Context/index.js')
// that fail when Metro resolves .ts source files in node_modules
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (originalResolveRequest) {
    try {
      return originalResolveRequest(context, moduleName, platform);
    } catch (e) {
      // fall through to directory resolution below
    }
  }

  // If the import is a relative path, try resolving as a directory with index
  if (moduleName.startsWith('.')) {
    const fromDir = path.dirname(context.originModulePath);
    const candidate = path.resolve(fromDir, moduleName);
    for (const ext of config.resolver.sourceExts) {
      const indexFile = path.join(candidate, `index.${ext}`);
      if (fs.existsSync(indexFile)) {
        return { type: 'sourceFile', filePath: indexFile };
      }
    }
  }

  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
