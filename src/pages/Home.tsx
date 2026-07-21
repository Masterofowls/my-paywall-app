// src/pages/Home.tsx
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";

export function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <h1 className="text-4xl font-bold mb-4">VideoApp</h1>
      <p className="text-lg mb-8 text-gray-600">
        Watch premium video content with a one-time purchase.
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          to="/video"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Watch Video
        </Link>
        {user ? (
          <Link
            to="/dashboard"
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            to="/login"
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
