"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

const ROLES = [
  { value: "attorney", label: "Attorney" },
  { value: "agent", label: "Real Estate Agent" },
  { value: "investor", label: "Investor / Wholesaler" },
  { value: "title_company", label: "Title Company / Abstractor" },
  { value: "other", label: "Other" },
];

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DC","DE","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "attorney",
    state: "",
    barNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signupRef, setSignupRef] = useState<string | null>(null);
  const betaMode = process.env.NEXT_PUBLIC_CLIROS_BETA_MODE === "true";

  // Capture beta attribution ?ref=BETA-firstname from the cold-email link.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (ref) {
      setSignupRef(ref.slice(0, 100));
      try { localStorage.setItem("cliros_signup_ref", ref.slice(0, 100)); } catch { /* no-op */ }
    } else {
      try {
        const stored = localStorage.getItem("cliros_signup_ref");
        if (stored) setSignupRef(stored);
      } catch { /* no-op */ }
    }
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Create profile row in cliros.users
    if (authData.user) {
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: form.email,
          name: form.name,
          role: form.role,
          state: form.state || null,
          bar_number: form.barNumber || null,
          signup_ref: signupRef || null,
        });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    // 3. Redirect to dashboard. Founding-attorney dossiers are granted
    // manually after the attorney replies with account email + first property.
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo size="lg" />
            <p className="mt-2 text-muted text-sm">
              {betaMode ? "Free beta access — no card required" : "Start with 5 free title search reports"}
            </p>
            {betaMode && signupRef && (
              <p className="mt-1 inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Beta invite · {signupRef}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-lg border border-danger/20">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                placeholder="David Harrington"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Work email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                placeholder="david@harringtonlaw.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                placeholder="At least 8 characters"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-foreground mb-1.5">
                  I am a...
                </label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-foreground mb-1.5">
                  State
                </label>
                <select
                  id="state"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                >
                  <option value="">Select...</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.role === "attorney" && (
              <div>
                <label htmlFor="barNumber" className="block text-sm font-medium text-foreground mb-1.5">
                  Bar number <span className="text-muted font-normal">(optional)</span>
                </label>
                <input
                  id="barNumber"
                  type="text"
                  value={form.barNumber}
                  onChange={(e) => update("barNumber", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  placeholder="Required for AOL generation"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create free account"}
            </button>

            <p className="text-xs text-muted text-center leading-relaxed">
              By creating an account you agree to our{" "}
              <a href="/terms" className="text-primary hover:text-primary-dark">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-primary hover:text-primary-dark">
                Privacy Policy
              </a>
              .
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-primary font-medium hover:text-primary-dark transition"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
