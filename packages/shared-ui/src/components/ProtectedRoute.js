"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@uet-panda/shared-config";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, userRole, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const loginPath = requireAdmin ? "/admin/login" : "/login";
        router.push(`${loginPath}?redirect=${pathname}`);
      } else if (requireAdmin && userRole !== "admin") {
        router.replace("/admin/login");
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, userRole, loading, requireAdmin, router, pathname]);

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-uet-gold"></div>
      </div>
    );
  }

  return <>{children}</>;
}
