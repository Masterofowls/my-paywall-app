// src/components/Payment/CheckoutButton.tsx
import { usePayment } from "@/lib/hooks/usePayment";

export function CheckoutButton() {
  const { createCheckout, loading } = usePayment();

  const handleClick = async () => {
    try {
      await createCheckout();
    } catch {
      // Errors are handled by the hook; keep the button usable.
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
    >
      {loading ? "Processing..." : "Pay with Stripe"}
    </button>
  );
}
