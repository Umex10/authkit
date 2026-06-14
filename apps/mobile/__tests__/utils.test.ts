import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names and drops falsy ones", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });

  it("resolves conflicting Tailwind classes in favour of the last one", () => {
    // tailwind-merge should keep only the final padding utility.
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("merges conditional objects", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});
