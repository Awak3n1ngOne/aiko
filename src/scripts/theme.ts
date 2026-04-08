// Bearnie-style theme toggle using .dark class
const THEME = "theme";
const LIGHT = "light";
const DARK = "dark";

const initialColorScheme = "";

function getPreferTheme(): string {
  const currentTheme = localStorage.getItem(THEME);
  if (currentTheme) return currentTheme;
  if (initialColorScheme) return initialColorScheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DARK
    : LIGHT;
}

let themeValue = window.__themeResolved ?? getPreferTheme();

function reflectPreference(): void {
  document.documentElement.classList.toggle("dark", themeValue === DARK);
  document.querySelector("#theme-btn")?.setAttribute("aria-label", themeValue);

  const body = document.body;
  if (body) {
    const bgColor = window.getComputedStyle(body).backgroundColor;
    document.querySelector("meta[name='theme-color']")?.setAttribute("content", bgColor);
  }
}

function setPreference(): void {
  localStorage.setItem(THEME, themeValue);
  reflectPreference();
}

reflectPreference();

function setThemeFeature(): void {
  reflectPreference();
  document.querySelector("#theme-btn")?.addEventListener("click", () => {
    themeValue = themeValue === LIGHT ? DARK : LIGHT;
    setPreference();
  });
}

setThemeFeature();
document.addEventListener("astro:after-swap", setThemeFeature);

document.addEventListener("astro:before-swap", event => {
  const bgColor = document.querySelector("meta[name='theme-color']")?.getAttribute("content");
  if (bgColor) {
    event.newDocument.querySelector("meta[name='theme-color']")?.setAttribute("content", bgColor);
  }
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ({ matches: isDark }) => {
  themeValue = isDark ? DARK : LIGHT;
  setPreference();
});
