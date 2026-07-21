// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePayment } from "@/lib/hooks/usePayment";

export function Dashboard() {
  const { user } = useAuth();
  const { checkAccess, confirmCheckout } = usePayment();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      setLoading(true);
      try {
        const sessionId = searchParams.get("session_id");
        if (sessionId) {
          setStatusMessage("Confirming payment...");
          const unlocked = await confirmCheckout(sessionId);
          if (!cancelled) {
            setHasAccess(unlocked);
            setSearchParams({}, { replace: true });
            if (unlocked) {
              setStatusMessage("Payment confirmed — opening your video...");
              navigate("/video", { replace: true });
              return;
            }
            setStatusMessage("");
          }
          return;
        }

        const access = await checkAccess();
        if (!cancelled) setHasAccess(access);
      } catch (error) {
        console.error("Failed to load access:", error);
        if (!cancelled) setStatusMessage("Could not confirm payment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAccess();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on mount / session_id
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="mb-2">
        Welcome, <strong>{user?.name || user?.email}</strong>
      </p>
      <p className="mb-2">
        Access status:{" "}
        <strong>{hasAccess ? "Premium unlocked" : "No access"}</strong>
      </p>
      {statusMessage && <p className="mb-4 text-sm text-green-700">{statusMessage}</p>}
      {hasAccess ? (
        <Link to="/video" className="bg-blue-600 text-white px-6 py-2 rounded">
          Watch Video
        </Link>
      ) : (
        <Link
          to="/pricing"
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Unlock Premium
        </Link>
      )}
    </div>
  );
}
