import Link from 'next/link';

export function NavTable({ items = [] }: { items?: Array<{ title: string; description?: string; href: string }> }) {
  return <div className="nav-table">{items.map((item) => <Link key={item.href} href={item.href.startsWith('/') ? `/docs${item.href}` : item.href}><strong>{item.title}</strong>{item.description && <span>{item.description}</span>}</Link>)}</div>;
}

export default NavTable;
