import { useEffect, useState } from "react";

// The BrandMD Journal lives at /blog/ as its own static publication (content-network site package `brandmd`,
// Pages project brandmd-journal, routed by the path-router Worker). The app only links to it, and reads its RSS feed
// for the homepage strip, so new articles show up here without an app deploy.
export const JOURNAL_URL = "/blog/";

export function useJournalFeed(limit = 3) {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    let live = true;
    fetch("/blog/feed.xml")
      .then((r) => (r.ok ? r.text() : ""))
      .then((xml) => {
        if (!live || !xml) return;
        const doc = new DOMParser().parseFromString(xml, "application/xml");
        const items = [...doc.querySelectorAll("item")].slice(0, limit).map((it) => {
          const link = it.querySelector("link")?.textContent || "";
          const date = new Date(it.querySelector("pubDate")?.textContent || "");
          return {
            href: link.replace(/^https?:\/\/[^/]+/, "") || JOURNAL_URL,
            title: it.querySelector("title")?.textContent || "",
            dek: it.querySelector("description")?.textContent || "",
            when: isNaN(date) ? "" : date.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" }),
          };
        });
        setPosts(items.filter((p) => p.title));
      })
      .catch(() => {});
    return () => { live = false; };
  }, [limit]);
  return posts;
}
