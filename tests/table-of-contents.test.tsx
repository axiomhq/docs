import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TableOfContents } from '@/components/table-of-contents';

afterEach(cleanup);

const items = [
  { title: 'Overview', url: '#overview', depth: 2 },
  { title: 'Nested details', url: '#nested-details', depth: 3 },
];

describe('TableOfContents', () => {
  it('does not change the current page state for modified link clicks', () => {
    const { container } = render(<TableOfContents items={items} />);

    const overview = screen.getByRole('link', { name: 'Overview' });
    const nested = screen.getByRole('link', { name: 'Nested details' });
    expect(overview).toHaveAttribute('aria-current', 'location');

    fireEvent.click(nested, { metaKey: true });
    expect(overview).toHaveAttribute('aria-current', 'location');
    expect(nested).not.toHaveAttribute('aria-current');

    fireEvent.click(nested);
    expect(nested).toHaveAttribute('aria-current', 'location');
    expect(nested.querySelector('span')).toHaveClass('line-clamp-2');
    expect(container.querySelector('[data-slot="toc-trace-progress"]')).toBeNull();
    expect(container.querySelector('[data-slot="toc-trace-end"]')).toBeNull();
  });
});
