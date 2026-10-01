import { Children, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TabsContent } from "fumadocs-ui/components/tabs";
import { afterEach, describe, expect, it } from "vitest";
import { DocsTabs } from "@/components/docs-tabs";
import { tabValues } from "@/lib/tab-values";

// Mirrors the MDX `Tabs`/`Tab` mapping in components/mdx-components.tsx,
// which can't be imported here (it pulls in fumadocs CSS).
function Tabs({ children, param }: { children: ReactNode; param?: string }) {
  const tabs = Children.toArray(children).filter(
    isValidElement,
  ) as ReactElement<{ title: string; children: ReactNode }>[];
  const items = tabs.map((tab) => tab.props.title);
  const values = tabValues(items);
  return (
    <DocsTabs items={items} values={values} param={param}>
      {tabs.map((tab, index) => (
        <TabsContent key={values[index]} value={values[index]}>
          {tab.props.children}
        </TabsContent>
      ))}
    </DocsTabs>
  );
}

function Tab(props: { title: string; children: ReactNode }) {
  return <>{props.children}</>;
}

const initialUrl = "/docs/console/intelligence/mcp-server";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", initialUrl);
});

function ClientTabs({ param }: { param?: string }) {
  return (
    <Tabs param={param}>
      <Tab title="Claude">Claude steps</Tab>
      <Tab title="Claude Code">Claude Code steps</Tab>
      <Tab title="VS Code">VS Code steps</Tab>
    </Tabs>
  );
}

// Radix tabs activate on mousedown, not click.
function selectTab(name: string) {
  fireEvent.mouseDown(screen.getByRole("tab", { name }), { button: 0 });
}

describe("tabValues", () => {
  it("derives URL- and id-safe values from titles", () => {
    expect(
      tabValues(["Claude Code", "Pro, Max, Team, or Enterprise", "fx", "Café"]),
    ).toEqual(["claude-code", "pro-max-team-or-enterprise", "fx", "cafe"]);
  });

  it("keeps values unique and never empty", () => {
    expect(tabValues(["C++", "C", "", "!!!"])).toEqual([
      "c",
      "c-2",
      "tab-3",
      "tab-4",
    ]);
  });
});

describe("MDX Tabs", () => {
  it("selects the first tab and keeps selection out of the URL without a param", () => {
    window.history.replaceState(null, "", `${initialUrl}?client=vs-code`);
    render(<ClientTabs />);

    expect(screen.getByRole("tab", { name: "Claude" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    selectTab("Claude Code");
    expect(screen.getByRole("tab", { name: "Claude Code" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(window.location.search).toBe("?client=vs-code");
  });

  it("opens the tab named by its URL param", () => {
    window.history.replaceState(null, "", `${initialUrl}?client=vs-code`);
    render(<ClientTabs param="client" />);

    const vsCode = screen.getByRole("tab", { name: "VS Code" });
    expect(vsCode).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "VS Code" })).toHaveTextContent(
      "VS Code steps",
    );
  });

  it("falls back to the first tab for an unknown URL value", () => {
    window.history.replaceState(null, "", `${initialUrl}?client=emacs`);
    render(<ClientTabs param="client" />);

    expect(screen.getByRole("tab", { name: "Claude" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("writes the selection to the URL, keeping other params and the hash", () => {
    window.history.replaceState(
      null,
      "",
      `${initialUrl}?plan=free#quick-setup`,
    );
    const historyLength = window.history.length;
    render(<ClientTabs param="client" />);

    selectTab("Claude Code");

    const params = new URLSearchParams(window.location.search);
    expect(params.get("client")).toBe("claude-code");
    expect(params.get("plan")).toBe("free");
    expect(window.location.hash).toBe("#quick-setup");
    expect(window.history.length).toBe(historyLength);
    expect(screen.getByRole("tab", { name: "Claude Code" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("restores nested groups from their own params", () => {
    window.history.replaceState(
      null,
      "",
      `${initialUrl}?client=claude&plan=free`,
    );
    render(
      <Tabs param="client">
        <Tab title="Claude">
          <Tabs param="plan">
            <Tab title="Pro, Max, Team, or Enterprise">Paid steps</Tab>
            <Tab title="Free">Free steps</Tab>
          </Tabs>
        </Tab>
        <Tab title="Cursor">Cursor steps</Tab>
      </Tabs>,
    );

    expect(screen.getByRole("tab", { name: "Claude" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const free = screen.getByRole("tab", { name: "Free" });
    expect(free).toHaveAttribute("aria-selected", "true");
    // Multi-word titles must yield a single, valid id reference.
    const paid = screen.getByRole("tab", {
      name: "Pro, Max, Team, or Enterprise",
    });
    expect(paid.getAttribute("aria-controls")).not.toMatch(/\s/);
  });
  it("follows #links into top-level tabs only", ({ onTestFinished }) => {
    // jsdom has no layout: treat inactive panels as hidden, like the CSS.
    Element.prototype.checkVisibility = function (this: Element) {
      return !this.closest('[data-state="inactive"]');
    };
    Element.prototype.scrollIntoView = () => {};
    onTestFinished(() => {
      delete (Element.prototype as Partial<Element>).checkVisibility;
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    });
    const followHash = (id: string) => {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
      fireEvent(window, new HashChangeEvent("hashchange"));
    };

    render(
      <Tabs param="client">
        <Tab title="Claude">
          <Tabs param="plan">
            <Tab title="Paid">Paid steps</Tab>
            <Tab title="Free">
              <h4 id="free-setup">Free setup</h4>
            </Tab>
          </Tabs>
        </Tab>
        <Tab title="Other">
          <h4 id="header-auth">Header auth</h4>
        </Tab>
      </Tabs>,
    );

    followHash("header-auth");
    expect(screen.getByRole("tab", { name: "Other" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(new URLSearchParams(window.location.search).get("client")).toBe(
      "other",
    );

    // A heading in a nested group selects only the outer tab around it.
    followHash("free-setup");
    expect(screen.getByRole("tab", { name: "Claude" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Paid" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(new URLSearchParams(window.location.search).get("plan")).toBeNull();
  });
});
