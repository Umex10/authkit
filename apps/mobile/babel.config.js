// Babel config for the Expo app.
//
// `jsxImportSource: "nativewind"` rewires JSX so NativeWind's className prop
// works on every React Native core component (the Tailwind-for-RN bridge).
// `react-native-reanimated/plugin` MUST stay last — it is required by both
// reanimated and sonner-native.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: ["react-native-reanimated/plugin"],
  };
};
