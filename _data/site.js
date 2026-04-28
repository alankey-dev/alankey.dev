/**
 * Site identity. Single source of truth for branding, navigation, and
 * metadata. Available in every template as `site`.
 *
 * The name "alankey" is a small play on "allen key" (the hex tool).
 */

const baseUrl = (process.env.BASE_URL || "http://localhost:8080").replace(
  /\/$/,
  "",
);

export default {
  name: "alankey",
  tagline: "Alan Gardner.",
  baseUrl,
  language: "en-GB",
  author: {
    name: "Alan Gardner",
  },
  social: [
    { label: "GitHub", href: "https://github.com/alankey-dev" },
    { label: "Bluesky", href: "https://bsky.app/profile/alankey.dev" },
    { label: "Email", href: "mailto:hello@alankey.dev" },
  ],
  nav: [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog/" },
    { label: "About", href: "/about/" },
  ],
  feed: {
    path: "/feed.xml",
    id: "tag:alankey.dev,2026:feed",
  },
  themeColor: {
    light: "#f6f7f4",
    dark: "#131a16",
  },
  sourceRepo: "https://github.com/alankey-dev/alankey.dev",
};
