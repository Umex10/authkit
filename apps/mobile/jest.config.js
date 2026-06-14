// Jest config for the Expo app. `jest-expo` wires up the React Native + Expo
// runtime; the extra entries in transformIgnorePatterns make sure our
// className/animation dependencies are transpiled (they ship untranspiled ESM).
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|react-native-confetti-cannon|sonner-native|react-native-reanimated|react-native-gesture-handler|expo-secure-store|expo-modules-core))",
  ],
};
