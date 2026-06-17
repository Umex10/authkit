// Registers the React Native Testing Library matchers (toBeOnTheScreen,
// toBeDisabled, …) for every test file. As of RNTL 14 the matchers are bundled
// into the package entry point (the old "/extend-expect" subpath is gone), so a
// plain import is all that's needed.
import "@testing-library/react-native";
