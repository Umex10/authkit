// Metro config wrapped with NativeWind so Tailwind classes are compiled from
// `global.css`. Mirrors the role Tailwind's PostCSS plugin plays in the web app.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
