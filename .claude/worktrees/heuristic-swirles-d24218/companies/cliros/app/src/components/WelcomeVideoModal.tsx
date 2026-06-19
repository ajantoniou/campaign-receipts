"use client";

/* ─── Welcome Video Modal ───
   Plays the 60s Cliros explainer the first time an attorney lands on
   the dashboard with free_reports_used >= free_reports_total AND
   reports_remaining == 0. Persists "seen" in localStorage so it only
   plays once per browser; can be re-watched from the Help & Docs page.
*/

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const SEEN_KEY = "cliros_welcome_seen_v1";

export default function WelcomeVideoModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SEEN_KEY) === "1") return;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: user } = await supabase
        .from("users")
        .select("free_reports_used, free_reports_total, reports_remaining")
        .eq("id", session.user.id)
        .single();
      if (!user) return;
      const trialExhausted = (user.free_reports_used ?? 0) >= (user.free_reports_total ?? 5);
      const noPackBalance = (user.reports_remaining ?? 0) === 0;
      if (trialExhausted && noPackBalance) setOpen(true);
    })();
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") localStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={dismiss}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-700 text-lg font-bold shadow-md"
          aria-label="Close video"
        >
          ×
        </button>
        <video
          src="/welcome-video.mp4"
          autoPlay
          controls
          playsInline
          className="w-full aspect-video bg-black"
          onEnded={dismiss}
        />
        <div className="p-5 border-t border-slate-200 bg-slate-50 text-sm text-slate-700 flex items-center justify-between">
          <span>
            Questions? <a href="mailto:support@cliros.ai" className="underline font-medium">support@cliros.ai</a>
            {" · "}Ideas? <a href="mailto:alex@cliros.ai" className="underline font-medium">alex@cliros.ai</a>
          </span>
          <button onClick={dismiss} className="text-slate-900 font-medium hover:underline">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
