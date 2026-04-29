/**
 * Theme toggle. Reads the current theme from <html data-theme>, wires up
 * the .theme-toggle button, persists the choice to localStorage under the
 * "theme" key, and keeps the <meta name="theme-color"> in sync. Pure
 * progressive enhancement: the button stays hidden until this module
 * runs, so non-JS visitors only ever see the default light theme.
 */

const STORAGE_KEY = "theme";

export function readStoredTheme(storage) {
  try {
    const value = storage.getItem(STORAGE_KEY);
    return value === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function writeStoredTheme(storage, theme) {
  try {
    storage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode or storage disabled — ignore. */
  }
}

export function applyTheme(root, metaThemeColor, theme, colors) {
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
  if (metaThemeColor && colors) {
    metaThemeColor.setAttribute(
      "content",
      theme === "dark" ? colors.dark : colors.light,
    );
  }
}

export function syncButton(button, theme) {
  const isDark = theme === "dark";
  button.setAttribute("aria-pressed", isDark ? "true" : "false");
  button.setAttribute(
    "aria-label",
    isDark ? "Switch to light theme" : "Switch to dark theme",
  );
}

export function init({ document: doc, storage }) {
  const button = doc.querySelector(".theme-toggle");
  if (!button) return null;

  const root = doc.documentElement;
  const meta = doc.querySelector('meta[name="theme-color"]');
  const colors = {
    light: button.dataset.themeLight,
    dark: button.dataset.themeDark,
  };

  let current = readStoredTheme(storage);
  applyTheme(root, meta, current, colors);
  syncButton(button, current);
  button.hidden = false;

  button.addEventListener("click", () => {
    current = current === "dark" ? "light" : "dark";
    applyTheme(root, meta, current, colors);
    syncButton(button, current);
    writeStoredTheme(storage, current);
  });

  return button;
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  init({ document, storage: window.localStorage });
}
