"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!sessionError) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasSession(Boolean(data.session));
      setCheckingSession(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: unknown) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasSession(Boolean(session));
        setCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Logo size="lg" />
            <p className="mt-2 text-muted text-sm">Choose a new password</p>
          </div>

          {checkingSession ? (
            <div className="bg-card border border-border text-muted text-sm px-4 py-3 rounded-lg text-center">
              Checking reset link...
            </div>
          ) : sent ? (
            <div className="space-y-4">
              <div className="bg-success/10 text-success text-sm px-4 py-3 rounded-lg border border-success/20 text-center">
                Password updated.
              </div>
              <a
                href="/dashboard"
                className="block w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary-dark transition text-center"
              >
                Go to dashboard
              </a>
            </div>
          ) : !hasSession ? (
            <div className="space-y-4">
              <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-lg border border-danger/20">
                This reset link is expired or invalid.
              </div>
              <a
                href="/forgot-password"
                className="block w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary-dark transition text-center"
              >
                Send a new reset link
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-lg border border-danger/20">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            <a
              href="/login"
              className="text-primary font-medium hover:text-primary-dark transition"
            >
              Back to sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
