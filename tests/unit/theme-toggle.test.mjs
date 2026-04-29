import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  applyTheme,
  init,
  readStoredTheme,
  syncButton,
  writeStoredTheme,
} from "../../scripts/theme-toggle.mjs";

function makeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    _data: data,
  };
}

function failingStorage() {
  return {
    getItem() {
      throw new Error("denied");
    },
    setItem() {
      throw new Error("denied");
    },
  };
}

function makeAttrEl() {
  return {
    attributes: {},
    setAttribute(k, v) {
      this.attributes[k] = String(v);
    },
    removeAttribute(k) {
      delete this.attributes[k];
    },
    getAttribute(k) {
      return this.attributes[k] ?? null;
    },
  };
}

function makeButton() {
  const el = {
    ...makeAttrEl(),
    dataset: { themeLight: "#fff", themeDark: "#000" },
    hidden: true,
    _listeners: new Map(),
    addEventListener(type, handler) {
      if (!this._listeners.has(type)) this._listeners.set(type, []);
      this._listeners.get(type).push(handler);
    },
    click() {
      for (const h of this._listeners.get("click") || []) h();
    },
  };
  return el;
}

function makeDocument({ withButton = true } = {}) {
  const root = makeAttrEl();
  const meta = makeAttrEl();
  const button = withButton ? makeButton() : null;
  return {
    documentElement: root,
    querySelector(sel) {
      if (sel === ".theme-toggle") return button;
      if (sel === 'meta[name="theme-color"]') return meta;
      return null;
    },
    _root: root,
    _meta: meta,
    _button: button,
  };
}

describe("readStoredTheme", () => {
  it("returns 'dark' only when storage holds the literal 'dark'", () => {
    assert.equal(readStoredTheme(makeStorage({ theme: "dark" })), "dark");
    assert.equal(readStoredTheme(makeStorage({ theme: "light" })), "light");
    assert.equal(readStoredTheme(makeStorage({ theme: "neon" })), "light");
    assert.equal(readStoredTheme(makeStorage()), "light");
  });

  it("falls back to 'light' if storage throws", () => {
    assert.equal(readStoredTheme(failingStorage()), "light");
  });
});

describe("writeStoredTheme", () => {
  it("persists the value", () => {
    const s = makeStorage();
    writeStoredTheme(s, "dark");
    assert.equal(s._data.theme, "dark");
  });

  it("swallows storage errors", () => {
    assert.doesNotThrow(() => writeStoredTheme(failingStorage(), "dark"));
  });
});

describe("applyTheme", () => {
  it("sets data-theme=dark and the dark theme-color when dark", () => {
    const root = makeAttrEl();
    const meta = makeAttrEl();
    applyTheme(root, meta, "dark", { light: "#fff", dark: "#000" });
    assert.equal(root.getAttribute("data-theme"), "dark");
    assert.equal(meta.getAttribute("content"), "#000");
  });

  it("removes data-theme and uses the light theme-color when light", () => {
    const root = makeAttrEl();
    root.setAttribute("data-theme", "dark");
    const meta = makeAttrEl();
    applyTheme(root, meta, "light", { light: "#fff", dark: "#000" });
    assert.equal(root.getAttribute("data-theme"), null);
    assert.equal(meta.getAttribute("content"), "#fff");
  });

  it("tolerates a missing meta element", () => {
    const root = makeAttrEl();
    assert.doesNotThrow(() =>
      applyTheme(root, null, "dark", { light: "#fff", dark: "#000" }),
    );
    assert.equal(root.getAttribute("data-theme"), "dark");
  });
});

describe("syncButton", () => {
  it("reflects the current theme in aria-pressed and aria-label", () => {
    const btn = makeAttrEl();
    syncButton(btn, "dark");
    assert.equal(btn.getAttribute("aria-pressed"), "true");
    assert.equal(btn.getAttribute("aria-label"), "Switch to light theme");
    syncButton(btn, "light");
    assert.equal(btn.getAttribute("aria-pressed"), "false");
    assert.equal(btn.getAttribute("aria-label"), "Switch to dark theme");
  });
});

describe("init", () => {
  let doc;
  let storage;

  beforeEach(() => {
    doc = makeDocument();
    storage = makeStorage();
  });

  it("returns null when there is no toggle button", () => {
    const empty = makeDocument({ withButton: false });
    assert.equal(init({ document: empty, storage }), null);
  });

  it("starts in the stored theme and reveals the button", () => {
    storage.setItem("theme", "dark");
    init({ document: doc, storage });
    assert.equal(doc._root.getAttribute("data-theme"), "dark");
    assert.equal(doc._meta.getAttribute("content"), "#000");
    assert.equal(doc._button.hidden, false);
    assert.equal(doc._button.getAttribute("aria-pressed"), "true");
  });

  it("flips the theme on click and persists it", () => {
    init({ document: doc, storage });
    assert.equal(doc._root.getAttribute("data-theme"), null);

    doc._button.click();
    assert.equal(doc._root.getAttribute("data-theme"), "dark");
    assert.equal(storage._data.theme, "dark");
    assert.equal(doc._button.getAttribute("aria-pressed"), "true");

    doc._button.click();
    assert.equal(doc._root.getAttribute("data-theme"), null);
    assert.equal(storage._data.theme, "light");
    assert.equal(doc._button.getAttribute("aria-pressed"), "false");
  });
});
