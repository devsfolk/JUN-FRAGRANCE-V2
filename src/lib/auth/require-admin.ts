import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const requireAdmin = cache(async function requireAdmin() {
  const supabase = await createClient();
  const { data: claimData, error: claimsError } = await supabase.auth.getClaims();
  const userId = typeof claimData?.claims.sub === "string" ? claimData.claims.sub : null;

  if (claimsError || !userId) {
    redirect("/dashboard/login");
  }

  const { data: admin, error: adminError } = await supabase
    .from("jf_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError || !admin) {
    redirect("/dashboard/login");
  }

  return { supabase, userId };
});