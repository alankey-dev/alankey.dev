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
  tagline: "Alan Gardner writes here.",
  baseUrl,
  language: "en-GB",
  author: {
    name: "Alan Gardner",
  },
  social: [
    { label: "GitHub", href: "https://github.com/Bigalan09" },
    { label: "Email", href: "mailto:hello@alankey.dev" },
  ],
  nav: [
    { label: "Home", href: "/" },
    { label: "Writing", href: "/writing/" },
    { label: "About", href: "/about/" },
  ],
  feed: {
    path: "/feed.xml",
    id: "tag:alankey.dev,2026:feed",
  },
  themeColor: {
    light: "#fdfcf7",
  },
  sourceRepo: "https://github.com/alankey-dev/alankey.dev",
};
