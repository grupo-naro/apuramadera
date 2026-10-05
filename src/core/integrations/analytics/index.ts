/**
 * Integración Analytics — API pública.
 *
 * Los `track*` helpers son seguros de llamar desde cualquier componente
 * cliente (defensivos contra que el script no haya cargado todavía).
 */
export { AnalyticsScripts } from "./analytics-scripts";
export { WebVitalsReporter } from "./web-vitals";
export {
  trackViewItem,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  type TrackedItem,
} from "./track";
