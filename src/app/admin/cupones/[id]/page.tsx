import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCouponForEdit } from "@/core/modules/coupons";
import { CouponForm } from "@/features/admin/coupon-form";
import { DeleteCouponButton } from "@/features/admin/delete-coupon-button";

export const metadata: Metadata = {
  title: "Editar cupón",
  robots: { index: false },
};

interface EditCouponPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCouponPage({ params }: EditCouponPageProps) {
  const { id } = await params;
  const coupon = await getCouponForEdit(id);

  if (!coupon) notFound();

  const { id: couponId, ...defaultValues } = coupon;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar cupón</h1>
          <p className="font-mono text-sm text-muted-foreground">
            {defaultValues.code}
          </p>
        </div>
        <DeleteCouponButton couponId={couponId} couponCode={defaultValues.code} />
      </div>
      <CouponForm couponId={couponId} defaultValues={defaultValues} />
    </div>
  );
}
