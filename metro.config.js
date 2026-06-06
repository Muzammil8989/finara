const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Suppress NativeWind warnings that cause navigation context serialization errors
process.env.NATIVEWIND_SUPPRESS_WARNINGS = "true";

module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: false,
});
