import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Notice } from "@/components/notice";

afterEach(cleanup);

describe("Notice", () => {
  it.each([
    ["info", "Info"],
    ["idea", "Idea"],
    ["warn", "Warning"],
    ["error", "Error"],
    ["success", "Success"],
  ] as const)("renders the %s variant with a Carbon icon and label", (type, label) => {
    const { container } = render(<Notice type={type}>Notice body</Notice>);
    const notice = container.querySelector(".doc-notice");
    const heading = container.querySelector('[data-slot="notice-heading"]');
    const icon = heading?.querySelector("svg");

    expect(notice).toHaveAttribute("data-notice-type", type);
    expect(heading).toHaveTextContent(label);
    expect(heading).toHaveClass("text-(--notice-accent)");
    expect(heading?.querySelector("strong")).toHaveClass(
      "text-(--notice-accent)!",
      "font-medium",
    );
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("width", "18");
    expect(icon).toHaveAttribute("height", "18");
  });

  it("uses a custom title in place of the default label", () => {
    const { container } = render(
      <Notice type="idea" title="Helpful pattern">
        Notice body
      </Notice>,
    );

    expect(
      container.querySelector('[data-slot="notice-heading"]'),
    ).toHaveTextContent("Helpful pattern");
  });

  it("normalizes legacy CallOut kinds", () => {
    const { container, rerender } = render(
      <Notice kind="tip">Tip body</Notice>,
    );

    expect(container.querySelector(".doc-notice")).toHaveAttribute(
      "data-notice-type",
      "idea",
    );
    expect(
      container.querySelector('[data-slot="notice-heading"]'),
    ).toHaveTextContent("Idea");

    rerender(<Notice kind="example">Example body</Notice>);
    expect(container.querySelector(".doc-notice")).toHaveAttribute(
      "data-notice-type",
      "info",
    );
    expect(
      container.querySelector('[data-slot="notice-heading"]'),
    ).toHaveTextContent("Example");
  });
});
