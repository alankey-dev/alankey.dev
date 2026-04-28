import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { initCodeCopy } from "../../scripts/code-copy.mjs";

/**
 * Tiny DOM stub. Only the methods our module touches are implemented.
 */
function makeDocument(preBlocks = []) {
  const elements = new Set();

  function makeEl(tag, opts = {}) {
    const el = {
      tagName: String(tag).toUpperCase(),
      attributes: {},
      children: [],
      parent: null,
      classList: new Set(),
      textContent: opts.textContent || "",
      _listeners: new Map(),
      style: {},
      setAttribute(k, v) {
        this.attributes[k] = String(v);
      },
      getAttribute(k) {
        return this.attributes[k];
      },
      addEventListener(type, handler) {
        if (!this._listeners.has(type)) this._listeners.set(type, []);
        this._listeners.get(type).push(handler);
      },
      removeEventListener(type, handler) {
        const arr = this._listeners.get(type) || [];
        this._listeners.set(
          type,
          arr.filter((h) => h !== handler),
        );
      },
      dispatchEvent(event) {
        for (const h of this._listeners.get(event.type) || []) {
          h.call(this, event);
        }
      },
      append(child) {
        child.parent = this;
        this.children.push(child);
      },
      appendChild(child) {
        this.append(child);
      },
      contains(child) {
        return (
          this.children.includes(child) ||
          this.children.some((c) => c.contains?.(child))
        );
      },
      querySelector(sel) {
        if (sel === "code") {
          return this.children.find((c) => c.tagName === "CODE");
        }
        return null;
      },
    };
    elements.add(el);
    return el;
  }

  const pres = preBlocks.map((text) => {
    const pre = makeEl("pre");
    const code = makeEl("code", { textContent: text });
    pre.append(code);
    return pre;
  });

  return {
    _pres: pres,
    _elements: elements,
    querySelectorAll(selector) {
      if (selector === "pre > code, pre code") return pres.map((p) => p.children[0]);
      if (selector === "pre") return pres;
      return [];
    },
    createElement(tag) {
      return makeEl(tag);
    },
  };
}

describe("code-copy", () => {
  let originalClipboard;

  beforeEach(() => {
    originalClipboard = globalThis.navigator?.clipboard;
  });

  it("is a no-op when there are no <pre> blocks", () => {
    const doc = makeDocument([]);
    assert.doesNotThrow(() => initCodeCopy({ document: doc, clipboard: { writeText: async () => {} } }));
    assert.equal(doc._pres.length, 0);
  });

  it("appends a copy button to each <pre>", () => {
    const doc = makeDocument(["one", "two"]);
    initCodeCopy({ document: doc, clipboard: { writeText: async () => {} } });
    for (const pre of doc._pres) {
      const btn = pre.children.find((c) => c.tagName === "BUTTON");
      assert.ok(btn, "expected a button child");
      assert.equal(btn.attributes["aria-label"], "Copy code");
      assert.equal(btn.attributes.type, "button");
      assert.ok(btn.classList.has("code-copy"));
    }
  });

  it("writes the code text to the clipboard on click", async () => {
    const doc = makeDocument(["console.log(42)"]);
    let written = null;
    const clipboard = {
      writeText: async (s) => {
        written = s;
      },
    };
    initCodeCopy({ document: doc, clipboard });
    const pre = doc._pres[0];
    const btn = pre.children.find((c) => c.tagName === "BUTTON");
    btn.dispatchEvent({ type: "click" });
    // dispatchEvent invokes the handler synchronously; allow microtasks to flush.
    await new Promise((r) => setImmediate(r));
    assert.equal(written, "console.log(42)");
  });

  it("announces success via aria-live after a successful copy", async () => {
    const doc = makeDocument(["x"]);
    initCodeCopy({ document: doc, clipboard: { writeText: async () => {} } });
    const btn = doc._pres[0].children.find((c) => c.tagName === "BUTTON");
    btn.dispatchEvent({ type: "click" });
    await new Promise((r) => setImmediate(r));
    assert.equal(btn.textContent, "Copied");
    assert.equal(btn.getAttribute("aria-live"), "polite");
  });

  it("is a no-op when the clipboard API is unavailable", () => {
    const doc = makeDocument(["x"]);
    assert.doesNotThrow(() => initCodeCopy({ document: doc, clipboard: undefined }));
    // No buttons should be added since the feature is unsupported.
    const pre = doc._pres[0];
    const btn = pre.children.find((c) => c.tagName === "BUTTON");
    assert.equal(btn, undefined);
  });

  // Restore globals
  it("does not leak globals", () => {
    assert.equal(globalThis.navigator?.clipboard, originalClipboard);
  });
});
