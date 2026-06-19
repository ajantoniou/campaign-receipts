"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const TITLE_UNDERWRITERS = [
  "First American",
  "Fidelity National",
  "Old Republic",
  "Stewart Title",
  "Chicago Title",
  "WFG National Title",
  "Westcor",
];

interface UserBasic {
  name: string;
  email: string;
  bar_number: string;
  firm_name: string;
  firm_address: string;
  state: string;
  phone: string;
}

interface FirmForm {
  firm_name: string;
  firm_address: string;
  firm_phone: string;
  firm_website: string;
  firm_logo_path: string;
  eo_carrier: string;
  eo_policy_no: string;
  eo_limits: string;
  eo_expiration: string;
  iolta_bank: string;
  iolta_disclosure_text: string;
  title_underwriters: string[];
  custom_exclusions_block: string;
  responsible_attorney_address: string;
  attorney_name: string;
  bar_number: string;
  attorney_state: string;
  attorney_direct_dial: string;
  attorney_email: string;
}

const emptyFirm = (): FirmForm => ({
  firm_name: "",
  firm_address: "",
  firm_phone: "",
  firm_website: "",
  firm_logo_path: "",
  eo_carrier: "",
  eo_policy_no: "",
  eo_limits: "",
  eo_expiration: "",
  iolta_bank: "",
  iolta_disclosure_text: "",
  title_underwriters: [],
  custom_exclusions_block: "",
  responsible_attorney_address: "",
  attorney_name: "",
  bar_number: "",
  attorney_state: "GA",
  attorney_direct_dial: "",
  attorney_email: "",
});

export default function SettingsPage() {
  const [user, setUser] = useState<UserBasic>({
    name: "",
    email: "",
    bar_number: "",
    firm_name: "",
    firm_address: "",
    state: "Georgia",
    phone: "",
  });
  const [firm, setFirm] = useState<FirmForm>(emptyFirm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("name, email, bar_number, firm_name, firm_address, state, phone")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setUser({
          name: data.name || "",
          email: data.email || session.user.email || "",
          bar_number: data.bar_number || "",
          firm_name: data.firm_name || "",
          firm_address: data.firm_address || "",
          state: data.state || "Georgia",
          phone: data.phone || "",
        });
      }

      try {
        const res = await fetch("/api/firm", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          const f = json.firm;
          const a = json.attorney;
          setFirm({
            ...emptyFirm(),
            firm_name: f?.firm_name || data?.firm_name || "",
            firm_address: f?.firm_address || data?.firm_address || "",
            firm_phone: f?.firm_phone || data?.phone || "",
            firm_website: f?.firm_website || "",
            firm_logo_path: f?.firm_logo_path || "",
            eo_carrier: f?.eo_carrier || "",
            eo_policy_no: f?.eo_policy_no || "",
            eo_limits: f?.eo_limits || "",
            eo_expiration: f?.eo_expiration || "",
            iolta_bank: f?.iolta_bank || "",
            iolta_disclosure_text: f?.iolta_disclosure_text || "",
            title_underwriters: f?.title_underwriters || [],
            custom_exclusions_block: f?.custom_exclusions_block || "",
            responsible_attorney_address: f?.responsible_attorney_address || "",
            attorney_name: a?.name || data?.name || "",
            bar_number: a?.bar_number || data?.bar_number || "",
            attorney_state: a?.state || "GA",
            attorney_direct_dial: a?.direct_dial || data?.phone || "",
            attorney_email: a?.email || "",
          });
          if (json.logo_preview_url) setLogoPreview(json.logo_preview_url);
        }
      } catch {
        /* firm API optional on first load */
      }

      setLoading(false);
    }
    load();
  }, []);

  function toggleUnderwriter(name: string) {
    setFirm((prev) => {
      const has = prev.title_underwriters.includes(name);
      return {
        ...prev,
        title_underwriters: has
          ? prev.title_underwriters.filter((u) => u !== name)
          : [...prev.title_underwriters, name],
      };
    });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/firm/logo", {
        method: "POST",
        credentials: "include",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Logo upload failed");
        return;
      }
      setFirm((prev) => ({ ...prev, firm_logo_path: json.firm_logo_path || prev.firm_logo_path }));
      if (json.preview_url) setLogoPreview(json.preview_url);
    } catch {
      setError("Logo upload failed");
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("users")
      .update({
        name: user.name,
        bar_number: user.bar_number,
        firm_name: firm.firm_name || user.firm_name,
        firm_address: firm.firm_address || user.firm_address,
        state: user.state,
        phone: firm.firm_phone || user.phone,
      })
      .eq("id", session.user.id);

    let saveErr: string | null = null;
    try {
      const res = await fetch("/api/firm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firm_name: firm.firm_name || user.firm_name,
          firm_address: firm.firm_address || user.firm_address,
          firm_phone: firm.firm_phone || user.phone,
          firm_website: firm.firm_website,
          firm_logo_path: firm.firm_logo_path,
          eo_carrier: firm.eo_carrier,
          eo_policy_no: firm.eo_policy_no,
          eo_limits: firm.eo_limits,
          eo_expiration: firm.eo_expiration,
          iolta_bank: firm.iolta_bank,
          iolta_disclosure_text: firm.iolta_disclosure_text,
          title_underwriters: firm.title_underwriters,
          custom_exclusions_block: firm.custom_exclusions_block,
          responsible_attorney_address: firm.responsible_attorney_address,
          attorney_name: firm.attorney_name || user.name,
          bar_number: firm.bar_number || user.bar_number,
          attorney_state: firm.attorney_state,
          attorney_direct_dial: firm.attorney_direct_dial,
          attorney_email: firm.attorney_email.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        saveErr = j.error || "Could not save firm profile";
      }
    } catch {
      saveErr = "Could not save firm profile";
    }

    setSaving(false);
    setError(saveErr);
    if (!saveErr) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
      <p className="text-sm text-muted mb-8">
        Attorney and firm profile for AOL letters, homeowner summaries, and GA Bar advertising compliance.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-foreground">Attorney (account)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Full Name</label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Bar Number</label>
              <input
                type="text"
                value={user.bar_number}
                onChange={(e) => setUser({ ...user, bar_number: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Email</label>
            <input type="email" value={user.email} disabled className={`${inputClass} bg-surface text-muted`} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-foreground">Firm letterhead</h2>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Firm Name</label>
            <input
              type="text"
              value={firm.firm_name}
              onChange={(e) => setFirm({ ...firm, firm_name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Firm Address</label>
            <input
              type="text"
              value={firm.firm_address}
              onChange={(e) => setFirm({ ...firm, firm_address: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Phone</label>
              <input
                type="tel"
                value={firm.firm_phone}
                onChange={(e) => setFirm({ ...firm, firm_phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Website</label>
              <input
                type="url"
                value={firm.firm_website}
                onChange={(e) => setFirm({ ...firm, firm_website: e.target.value })}
                className={inputClass}
                placeholder="https://"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Firm logo</label>
            <div className="flex items-start gap-4">
              <div className="w-28 h-20 border border-border rounded-lg bg-surface flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Firm logo" className="max-w-full max-h-full object-contain p-1" />
                ) : (
                  <span className="text-[10px] text-muted text-center px-2">No logo</span>
                )}
              </div>
              <div>
                <label className="inline-block bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer hover:bg-primary-dark transition">
                  {logoUploading ? "Uploading…" : "Upload logo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={logoUploading}
                    onChange={handleLogoUpload}
                  />
                </label>
                <p className="text-[10px] text-muted mt-2">PNG, JPG, or WebP · max 2 MB · appears on AOL and client PDFs</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Responsible attorney address (GA Bar 7.x)</label>
            <input
              type="text"
              value={firm.responsible_attorney_address}
              onChange={(e) => setFirm({ ...firm, responsible_attorney_address: e.target.value })}
              className={inputClass}
            />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-foreground">E&amp;O insurance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Carrier</label>
              <input
                type="text"
                value={firm.eo_carrier}
                onChange={(e) => setFirm({ ...firm, eo_carrier: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Policy #</label>
              <input
                type="text"
                value={firm.eo_policy_no}
                onChange={(e) => setFirm({ ...firm, eo_policy_no: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Limits</label>
              <input
                type="text"
                value={firm.eo_limits}
                onChange={(e) => setFirm({ ...firm, eo_limits: e.target.value })}
                className={inputClass}
                placeholder="$1M / $2M"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Expiration</label>
              <input
                type="date"
                value={firm.eo_expiration?.slice(0, 10) || ""}
                onChange={(e) => setFirm({ ...firm, eo_expiration: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-foreground">IOLTA (GA Bar Rule 1.15)</h2>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">IOLTA bank</label>
            <input
              type="text"
              value={firm.iolta_bank}
              onChange={(e) => setFirm({ ...firm, iolta_bank: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Disclosure paragraph</label>
            <textarea
              value={firm.iolta_disclosure_text}
              onChange={(e) => setFirm({ ...firm, iolta_disclosure_text: e.target.value })}
              rows={4}
              className={inputClass}
            />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border p-6 space-y-3">
          <h2 className="font-bold text-foreground">Title underwriter affiliations</h2>
          <div className="flex flex-wrap gap-2">
            {TITLE_UNDERWRITERS.map((u) => (
              <label
                key={u}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition ${
                  firm.title_underwriters.includes(u)
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-muted hover:border-accent/40"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={firm.title_underwriters.includes(u)}
                  onChange={() => toggleUnderwriter(u)}
                />
                {u}
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-bold text-foreground">Default issuing attorney (AOL)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Name on letter</label>
              <input
                type="text"
                value={firm.attorney_name}
                onChange={(e) => setFirm({ ...firm, attorney_name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Bar #</label>
              <input
                type="text"
                value={firm.bar_number}
                onChange={(e) => setFirm({ ...firm, bar_number: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Direct dial</label>
              <input
                type="tel"
                value={firm.attorney_direct_dial}
                onChange={(e) => setFirm({ ...firm, attorney_direct_dial: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Public contact email</label>
              <p className="text-[10px] text-muted mb-1">Shown on client PDFs only. Your login email stays private.</p>
              <input
                type="email"
                value={firm.attorney_email}
                onChange={(e) => setFirm({ ...firm, attorney_email: e.target.value })}
                placeholder="closing@yourfirm.com"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Custom exclusions (boilerplate)</label>
            <textarea
              value={firm.custom_exclusions_block}
              onChange={(e) => setFirm({ ...firm, custom_exclusions_block: e.target.value })}
              rows={4}
              className={inputClass}
            />
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      <p className="mt-8 text-xs text-muted">
        Need multi-attorney roster or signature image upload? Email{" "}
        <a href="mailto:alex@cliros.ai" className="underline">alex@cliros.ai</a>.
      </p>
    </div>
  );
}
