import type { Metadata } from "next";

import { CouponForm } from "@/features/admin/coupon-form";

export const metadata: Metadata = {
  title: "Nuevo cupón",
  robots: { index: false },
};

export default function NewCouponPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo cupón</h1>
        <p className="text-sm text-muted-foreground">
          Definí el código y el descuento a aplicar.
        </p>
      </div>
      <CouponForm />
    </div>
  );
}
