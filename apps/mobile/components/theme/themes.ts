import { vars } from "nativewind";

/**
 * Runtime design tokens applied at the app root via NativeWind's `vars()`.
 *
 * tailwind.config.js references these as `rgb(var(--token) / <alpha-value>)`, so
 * switching the object below (driven by the color scheme in providers.tsx) re-
 * themes every `bg-*`/`text-*`/`border-*` class at once. Same violet palette as
 * the web app's globals.css.
 */
export const themes = {
  light: vars({
    "--background": "255 255 255",
    "--foreground": "24 24 27",
    "--card": "255 255 255",
    "--card-foreground": "24 24 27",
    "--popover": "255 255 255",
    "--popover-foreground": "24 24 27",
    "--primary": "124 58 237",
    "--primary-foreground": "255 255 255",
    "--secondary": "244 244 245",
    "--secondary-foreground": "24 24 27",
    "--muted": "244 244 245",
    "--muted-foreground": "113 113 122",
    "--accent": "244 244 245",
    "--accent-foreground": "24 24 27",
    "--destructive": "239 68 68",
    "--border": "228 228 231",
    "--input": "228 228 231",
    "--ring": "124 58 237",
  }),
  dark: vars({
    "--background": "10 10 15",
    "--foreground": "250 250 250",
    "--card": "21 21 27",
    "--card-foreground": "250 250 250",
    "--popover": "26 26 34",
    "--popover-foreground": "250 250 250",
    "--primary": "139 92 246",
    "--primary-foreground": "255 255 255",
    "--secondary": "31 31 39",
    "--secondary-foreground": "250 250 250",
    "--muted": "31 31 39",
    "--muted-foreground": "161 161 170",
    "--accent": "31 31 39",
    "--accent-foreground": "250 250 250",
    "--destructive": "248 113 113",
    "--border": "39 39 46",
    "--input": "39 39 46",
    "--ring": "139 92 246",
  }),
};
