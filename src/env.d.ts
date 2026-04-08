/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface Window {
  theme?: {
    themeValue: string;
    setPreference: () => void;
    reflectPreference: () => void;
    getTheme: () => string;
    setTheme: (val: string) => void;
  };
  __themeResolved?: string;
}
