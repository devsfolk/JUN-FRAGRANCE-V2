"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useCartDrawer } from "@/lib/site/cart-store";
import { CartToast } from "./cart-toast";

const DynamicCartDrawer = dynamic(
  () => import("./cart-drawer").then((mod) => mod.CartDrawer),
  { ssr: false }
);

interface CartDrawerRootProps {
  whatsappNumber: string | null;
  siteUrl: string;
}

export function CartDrawerRoot({
  whatsappNumber,
  siteUrl,
}: CartDrawerRootProps) {
  const { isOpen } = useCartDrawer();
  const [hasEverOpened, setHasEverOpened] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasEverOpened(true);
    }
  }, [isOpen]);

  if (!whatsappNumber) return null;

  return (
    <>
      <CartToast />
      {hasEverOpened ? (
        <DynamicCartDrawer
          whatsappNumber={whatsappNumber}
          siteUrl={siteUrl}
        />
      ) : null}
    </>
  );
}
