const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// expo-sqlite on web loads a WebAssembly build of SQLite. Without "wasm" as an
// asset type Metro can't resolve it and the web bundle fails (HTTP 500).
config.resolver.assetExts.push("wasm");

// expo-sqlite's web worker needs SharedArrayBuffer, which browsers only allow
// on cross-origin-isolated pages.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  return middleware(req, res, next);
};

// Suppress NativeWind warnings that cause navigation context serialization errors
process.env.NATIVEWIND_SUPPRESS_WARNINGS = "true";

module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: false,
});
