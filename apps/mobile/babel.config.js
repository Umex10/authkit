// Babel config for the Expo app.
//
// `jsxImportSource: "nativewind"` rewires JSX so NativeWind's className prop
// works on every React Native core component (the Tailwind-for-RN bridge).
// `react-native-worklets/plugin` MUST stay last — as of Reanimated 4 the
// worklets engine lives in its own package, so the plugin moved here from
// `react-native-reanimated/plugin`. It is required by reanimated + sonner-native.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: ["react-native-worklets/plugin"],
  };
};
