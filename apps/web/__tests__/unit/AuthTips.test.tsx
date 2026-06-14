import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthTips } from "@/components/AuthTips";

describe("AuthTips", () => {
  it("shows sign-up specific guidance", () => {
    render(<AuthTips variant="sign-up" />);
    expect(
      screen.getByText(/POST \/auth\/sign-up/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ein Account, in Sekunden\./i)).toBeInTheDocument();
  });

  it("shows sign-in specific guidance", () => {
    render(<AuthTips variant="sign-in" />);
    expect(screen.getByText(/POST \/auth\/sign-in/i)).toBeInTheDocument();
    expect(screen.getByText(/Willkommen zurück\./i)).toBeInTheDocument();
  });

  it("always points to the Swagger UI", () => {
    render(<AuthTips variant="sign-up" />);
    expect(screen.getByText(/swagger-ui\.html/i)).toBeInTheDocument();
  });
});
