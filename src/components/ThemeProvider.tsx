"use client";

import { type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const NextThemesProvider = require("next-themes").ThemeProvider;
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
