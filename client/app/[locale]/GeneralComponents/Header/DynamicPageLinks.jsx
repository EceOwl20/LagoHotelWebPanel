"use client";

import Link from "next/link";

export default function DynamicPageLinks({ items = [], className = "" }) {
  return items.map((item) => (
    <Link key={item.id} href={item.href} className={className}>
      {item.label}
    </Link>
  ));
}
