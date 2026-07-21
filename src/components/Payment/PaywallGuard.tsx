// src/components/Payment/PaywallGuard.tsx
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePayment } from "@/lib/hooks/usePayment";
import { Link } from "react-router-dom";

export function PaywallGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { checkAccess } = usePayment();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setHasAccess(false);
      return;
    }
    let cancelled = false;
    checkAccess().then((access) => {
      if (!cancelled) setHasAccess(access);
    });
    return () => {
      cancelled = true;
    };
  }, [user, loading, checkAccess]);

  if (loading || (user && hasAccess === null)) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <h2>🔒 Sign in Required</h2>
        <Link to="/login" className="text-blue-600">
          Sign In
        </Link>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto p-8 text-center border rounded-lg">
        <h2 className="text-2xl font-bold">🚀 Unlock Premium</h2>
        <p className="text-3xl font-bold text-blue-600 my-4">$19.99</p>
        <Link
          to="/pricing"
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Get Access Now
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
