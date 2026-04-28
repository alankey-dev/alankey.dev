/**
 * Default frontmatter for posts under content/blog/<slug>/.
 * Each post inherits these unless overridden in its own frontmatter.
 */
export default {
  layout: "post.njk",
  tags: ["posts"],
  permalink: "/blog/{{ page.fileSlug }}/",
  isPost: true,
  ogType: "article",
};
