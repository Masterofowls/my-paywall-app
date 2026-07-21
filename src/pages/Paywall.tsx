// src/pages/Paywall.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { CheckoutButton } from "@/components/Payment/CheckoutButton";

export function Paywall() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-md mx-auto p-8 border rounded-lg">
      <h1 className="text-3xl font-bold mb-4">Premium Access</h1>
      <p className="text-4xl font-bold text-blue-600 mb-6">$19.99</p>
      <CheckoutButton />
      <div className="mt-4 p-3 bg-yellow-50 text-xs">
        Test card: <strong>4242 4242 4242 4242</strong>
      </div>
    </div>
  );
}
