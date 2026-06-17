// Flat ESLint config for the Expo app.
//
// Committed (together with the `eslint` + `eslint-config-expo` devDependencies)
// so the first `npm run lint` after a fresh clone runs immediately — without
// Expo's interactive "install ~238 packages?" prompt, which is not CI-friendly.
const expo = require("eslint-config-expo/flat");

module.exports = [
  ...expo,
  {
    ignores: ["node_modules/", ".expo/", "dist/"],
  },
];
