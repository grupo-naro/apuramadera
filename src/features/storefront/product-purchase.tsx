"use client";

/**
 * Bloque de compra de la PDP: selector de variante + precio + stock +
 * botón "Agregar al carrito" (M2.1, ya funcional).
 */
import { useEffect, useState, useTransition } from "react";

import { trackAddToCart, trackViewItem } from "@/core/integrations/analytics";
import type { ProductDetail, ProductVariant } from "@/core/modules/catalog";
import { addToCart } from "@/core/modules/cart";
import { Badge } from "@/core/ui/badge";
import { Button } from "@/core/ui/button";
import { Price, VariantSelector } from "@/core/ui/commerce";
import { useCartStore } from "@/features/cart/cart-store";

export function ProductPurchase({ product }: { product: ProductDetail }) {
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [pending, startTransition] = useTransition();
  const setCart = useCartStore((state) => state.setCart);
  const openCart = useCartStore((state) => state.openCart);

  const canBuy = variant !== null && variant.inStock;

  // view_item — al cargar la PDP.
  useEffect(() => {
    trackViewItem({
      productId: product.id,
      name: product.name,
      unitPrice: product.priceRange.min,
    });
  }, [product.id, product.name, product.priceRange.min]);

  function handleAddToCart() {
    if (!variant) return;
    const variantId = variant.id;
    const productId = product.id;
    const productName = product.name;
    const unitPrice = variant.price;
    startTransition(async () => {
      const updated = await addToCart(variantId, 1);
      setCart(updated);
      openCart();
      trackAddToCart({
        productId,
        name: productName,
        unitPrice,
        quantity: 1,
      });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {variant ? (
          <Price
            amount={variant.price}
            compareAt={variant.compareAtPrice}
            size="lg"
          />
        ) : (
          <span className="text-sm text-muted-foreground">
            Seleccioná una variante
          </span>
        )}
        {variant &&
          (variant.inStock ? (
            <Badge variant="secondary">{variant.stock} en stock</Badge>
          ) : (
            <Badge variant="destructive">Sin stock</Badge>
          ))}
      </div>

      <VariantSelector product={product} onVariantChange={setVariant} />

      <Button size="lg" disabled={!canBuy || pending} onClick={handleAddToCart}>
        {pending
          ? "Agregando…"
          : canBuy
            ? "Agregar al carrito"
            : "No disponible"}
      </Button>
    </div>
  );
}
