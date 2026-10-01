// Stable, URL- and id-safe tab values derived from MDX tab titles:
// "Pro, Max, Team, or Enterprise" → "pro-max-team-or-enterprise". Radix
// builds each trigger/panel id from the value, so it must not contain
// whitespace (aria-controls is a space-separated id list), and URL-synced
// tabs write it verbatim as the query value.
export function tabValues(titles: string[]): string[] {
  const seen = new Map<string, number>();
  return titles.map((title, index) => {
    const base =
      title
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `tab-${index + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  });
}
