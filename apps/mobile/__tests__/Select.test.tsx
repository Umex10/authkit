import { fireEvent, render, screen } from "@testing-library/react-native";
import { Select } from "@/components/ui/Select";

const ROLE_OPTIONS = [
  { label: "User", value: "USER" as const },
  { label: "Admin", value: "ADMIN" as const },
];

describe("Select (segmented)", () => {
  it("renders all options", async () => {
    await render(<Select value="USER" onChange={() => {}} options={ROLE_OPTIONS} />);
    expect(screen.getByText("User")).toBeOnTheScreen();
    expect(screen.getByText("Admin")).toBeOnTheScreen();
  });

  it("calls onChange with the tapped option's value", async () => {
    const onChange = jest.fn();
    await render(<Select value="USER" onChange={onChange} options={ROLE_OPTIONS} />);

    fireEvent.press(screen.getByText("Admin"));

    expect(onChange).toHaveBeenCalledWith("ADMIN");
  });
});
