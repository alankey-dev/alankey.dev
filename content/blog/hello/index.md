---
title: "Hello, world"
description: "A first post. Why this site exists, and what to expect from it."
date: 2026-04-28
---

This is the first post on alankey.dev. I built the site because I wanted
somewhere to put longer writing without the gravity well of a "platform".

## Why bother

There are many places to publish online. Most of them ask you to trade your
words for surveillance, distraction, or both. A small static site you own
asks for none of that. It is also, unexpectedly, **fun** to make.

## What to expect

I plan to write about:

1. The systems I build, including the dead ends.
2. Notes on tools that I would have liked to read before I bought, learnt,
   or wrote them.
3. Occasional asides on whatever interests me at the time.

> Brevity is a virtue. Most of what I publish here will be short.

You can read the source of this site on
[GitHub](https://github.com/alankey-dev/alankey.dev). If you spot a typo,
please open an issue.

### A bit of code

Here is a small piece of JavaScript, mostly so I can verify the syntax
highlighter looks reasonable in both light and dark mode:

```js
function greet(name) {
  if (!name) return "Hello, world";
  return `Hello, ${name}`;
}

console.log(greet("Alan"));
```

And a one-line shell snippet:

```bash
echo "ship it"
```

That's all for the first post. Thanks for reading.[^1]

[^1]: If you got this far, the markdown renderer, footnote plugin, and
syntax highlighter are all working. Thanks for being my smoke test.
