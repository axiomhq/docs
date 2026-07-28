const urlPropertyNames = [
  '$current_url',
  '$referrer',
  '$link_url',
  '$external_click_url',
] as const;

export function withoutUrlDetails(value: string) {
  try {
    const url = new URL(value, 'https://axiom.co');
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

export function sanitizePostHogEvent<
  Event extends { properties?: Record<string, unknown> } | null,
>(event: Event): Event {
  if (!event?.properties) return event;

  const properties = { ...event.properties };
  for (const name of urlPropertyNames) {
    const value = properties[name];
    if (typeof value === 'string') properties[name] = withoutUrlDetails(value);
  }

  return { ...event, properties } as Event;
}
