import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  Accordion,
  AccordionGroup,
} from "@/components/mdx-accordion";

afterEach(cleanup);

describe("MDX accordions", () => {
  it("keeps collapsed content searchable with an accessible disclosure", async () => {
    const { container } = render(
      <Accordion title="Searchable setup">
        <p>A unique phrase inside the collapsed panel.</p>
      </Accordion>,
    );

    const trigger = screen.getByRole("button", {
      name: "Searchable setup",
    });
    const panel = container.querySelector<HTMLElement>(
      '[data-slot="accordion-content"]',
    );

    expect(panel).not.toBeNull();
    expect(trigger.parentElement?.tagName).toBe("H3");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveAttribute("aria-controls");
    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-labelledby", trigger.id);
    expect(panel).toHaveTextContent(
      "A unique phrase inside the collapsed panel.",
    );
    expect(trigger.querySelectorAll("svg")).toHaveLength(2);
    for (const icon of trigger.querySelectorAll("svg")) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveAttribute("focusable", "false");
    }

    await waitFor(() => {
      expect(panel).toHaveAttribute("hidden", "until-found");
    });
  });

  it("opens the matching panel when the browser fires beforematch", async () => {
    const { container } = render(
      <Accordion title="Find me">
        <p>Browser-searchable content</p>
      </Accordion>,
    );

    const trigger = screen.getByRole("button", { name: "Find me" });
    const panel = container.querySelector<HTMLElement>(
      '[data-slot="accordion-content"]',
    );
    expect(panel).not.toBeNull();

    await waitFor(() => {
      expect(panel).toHaveAttribute("hidden", "until-found");
    });
    fireEvent(panel!, new Event("beforematch", { bubbles: true }));

    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveAttribute("aria-controls", panel?.id);
      expect(panel).not.toHaveAttribute("hidden");
    });
  });

  it("keeps grouped accordions single-open without unmounting closed copy", async () => {
    const { container } = render(
      <AccordionGroup>
        <Accordion title="First item">First body</Accordion>
        <Accordion title="Second item">Second body</Accordion>
      </AccordionGroup>,
    );

    const first = screen.getByRole("button", { name: "First item" });
    const second = screen.getByRole("button", { name: "Second item" });

    fireEvent.click(first);
    await waitFor(() => {
      expect(first).toHaveAttribute("aria-expanded", "true");
    });

    fireEvent.click(second);
    await waitFor(() => {
      expect(first).toHaveAttribute("aria-expanded", "false");
      expect(second).toHaveAttribute("aria-expanded", "true");
    });

    const panels = container.querySelectorAll<HTMLElement>(
      '[data-slot="accordion-content"]',
    );
    expect(panels).toHaveLength(2);
    expect(panels[0]).toHaveTextContent("First body");
    expect(panels[0]).toHaveAttribute("hidden", "until-found");
    expect(panels[1]).not.toHaveAttribute("hidden");
  });
});
