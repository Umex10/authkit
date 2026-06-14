import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Sign in</Button>);
    expect(screen.getByText("Sign in")).toBeOnTheScreen();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Tap me</Button>);

    fireEvent.press(screen.getByText("Tap me"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("is disabled (and unpressable) while loading", () => {
    render(<Button loading>Working</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when the disabled prop is set", () => {
    render(<Button disabled>Nope</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
