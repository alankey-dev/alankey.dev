/**
 * Progressive enhancement: copy-to-clipboard buttons on <pre> code blocks.
 *
 * Loaded only on post pages by layouts/post.njk. Pure no-op without
 * Clipboard API support, without <pre> blocks, or with JavaScript
 * disabled.
 *
 * Exposes initCodeCopy({ document, clipboard }) for testing.
 */

const RESET_AFTER_MS = 1500;

export function initCodeCopy({ document, clipboard } = {}) {
  if (!document) return;
  if (!clipboard || typeof clipboard.writeText !== "function") return;

  const pres = document.querySelectorAll("pre");
  if (!pres || pres.length === 0) return;

  for (const pre of pres) {
    const code = pre.querySelector("code");
    if (!code) continue;

    const btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.setAttribute("aria-label", "Copy code");
    btn.classList.add("code-copy");
    btn.textContent = "Copy";

    btn.addEventListener("click", async () => {
      try {
        await clipboard.writeText(code.textContent);
        btn.textContent = "Copied";
        btn.setAttribute("aria-live", "polite");
        setTimeoutSafe(() => {
          btn.textContent = "Copy";
        }, RESET_AFTER_MS);
      } catch {
        btn.textContent = "Copy failed";
        btn.setAttribute("aria-live", "polite");
      }
    });

    pre.append(btn);
  }
}

function setTimeoutSafe(fn, ms) {
  if (typeof setTimeout === "function") setTimeout(fn, ms);
}

// Auto-init when loaded as a script in the browser (not under tests).
if (typeof document !== "undefined" && typeof navigator !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initCodeCopy({ document, clipboard: navigator.clipboard });
    });
  } else {
    initCodeCopy({ document, clipboard: navigator.clipboard });
  }
}
