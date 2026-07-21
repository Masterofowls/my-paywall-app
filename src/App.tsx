// src/App.tsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/hooks/useAuth";
import { Home } from "@/pages/Home";
import { Dashboard } from "@/pages/Dashboard";
import { VideoPlayer } from "@/pages/VideoPlayer";
import { Paywall } from "@/pages/Paywall";
import { LoginForm } from "@/components/Auth/LoginForm";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import "./App.css";

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="p-4 border-b flex justify-between">
      <Link to="/" className="font-bold text-xl">
        VideoApp
      </Link>
      <div className="flex gap-4">
        <Link to="/video">Watch</Link>
        <Link to="/pricing">Pricing</Link>
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navigation />
        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/pricing" element={<Paywall />} />
            <Route path="/video" element={<VideoPlayer />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
