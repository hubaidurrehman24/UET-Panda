"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@uet-panda/shared-config";

/**
 * Admin Root Page: Redirects to login or dashboard.
 */
export default function AdminRoot() {
  const { user, userRole, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || userRole !== "admin") {
        router.replace("/admin/login");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, userRole, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-uet-gold"></div>
    </div>
  );
}
