/**
 * Emite los tokens de `store.config.ts` como CSS vars inline en `:root`
 * y `.dark`. Va dentro del `<RootLayout>` antes del contenido para que
 * el CSS resuelva con los valores de la tienda desde el primer paint.
 *
 * Mantiene en sync los nombres camelCase de TS con los kebab-case de
 * CSS (`primaryForeground` → `--primary-foreground`).
 */
import type { StoreThemeTokens } from "@/store.config";
import { storeConfig } from "@/store.config";

/** camelCase → kebab-case para los nombres de variables CSS. */
function toKebab(name: string): string {
  return name.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function tokensToCss(tokens: StoreThemeTokens): string {
  return (Object.entries(tokens) as [keyof StoreThemeTokens, string][])
    .map(([key, value]) => `--${toKebab(key)}: ${value};`)
    .join("");
}

export function ThemeStyle() {
  const { theme } = storeConfig;
  const css = `:root{--radius:${theme.radius};${tokensToCss(theme.light)}}.dark{${tokensToCss(theme.dark)}}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
