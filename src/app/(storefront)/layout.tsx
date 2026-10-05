import { AnalyticsScripts, WebVitalsReporter } from "@/core/integrations/analytics";
import { CartDrawer } from "@/features/cart/cart-drawer";
import { CartProvider } from "@/features/cart/cart-provider";
import { AnnouncementBar } from "@/features/storefront/announcement-bar";
import { Footer } from "@/features/storefront/footer";
import { Header } from "@/features/storefront/header";
import { WhatsAppButton } from "@/features/storefront/whatsapp-button";

/**
 * Layout del storefront: header + contenido + footer + carrito.
 * Acá viven los scripts de analytics — el panel admin no los carga.
 */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartProvider />
      <CartDrawer />
      <WhatsAppButton />
      <AnalyticsScripts />
      <WebVitalsReporter />
    </div>
  );
}
