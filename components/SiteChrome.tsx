"use client";
import { usePathname } from "next/navigation";

// The site's header, footer, tab bar, help button and service worker, left out of /embed/ pages, which live inside
// other people's sites (Romily, round ten, q8). /embed itself, the page for publishers, keeps them.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path?.startsWith("/embed/") ? null : <>{children}</>;
}
