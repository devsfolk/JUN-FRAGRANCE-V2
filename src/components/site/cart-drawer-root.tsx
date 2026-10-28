"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useCartDrawer } from "@/lib/site/cart-store";
import { CartToast } from "./cart-toast";

const DynamicCartDrawer = dynamic(
  () => import("./cart-drawer").then((mod) => mod.CartDrawer),
  { ssr: false }
);

interface CartDrawerRootProps {
  whatsappNumber: string | null;
  siteUrl: string;
  bundleEnabled?: boolean;
  bundlePrice?: number;
}

export function CartDrawerRoot({
  whatsappNumber,
  siteUrl,
  bundleEnabled = true,
  bundlePrice = 4500,
}: CartDrawerRootProps) {
  const { isOpen } = useCartDrawer();
  const [hasEverOpened, setHasEverOpened] = useState(false);

  if (isOpen && !hasEverOpened) {
    setHasEverOpened(true);
  }

  if (!whatsappNumber) return null;

  return (
    <>
      <CartToast />
      {hasEverOpened ? (
        <DynamicCartDrawer
          whatsappNumber={whatsappNumber}
          siteUrl={siteUrl}
          bundleEnabled={bundleEnabled}
          bundlePrice={bundlePrice}
        />
      ) : null}
    </>
  );
}
