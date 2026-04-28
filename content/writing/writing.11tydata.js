/**
 * Default frontmatter for posts under content/writing/<slug>/.
 * Each post inherits these unless overridden in its own frontmatter.
 */
export default {
  layout: "post.njk",
  tags: ["posts"],
  permalink: "/writing/{{ page.fileSlug }}/",
  isPost: true,
  ogType: "article",
};
