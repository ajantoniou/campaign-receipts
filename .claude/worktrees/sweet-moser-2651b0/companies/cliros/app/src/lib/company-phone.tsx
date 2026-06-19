// Local mirror of shared/react/CompanyPhoneLink. Inlined here because
// Turbopack at Render's rootDir (companies/cliros/app) cannot resolve
// imports that escape the rootDir, even though tsc walks the monorepo and
// resolves them at type-check time. Same class of bug as the EP Footer.tsx
// escaping-import fix. Keep COMPANY_PHONE_E164 in sync with
// shared/config/company-contact.js (canonical: +17047714720) if the
// portfolio phone number ever changes.

import type { ReactElement } from "react";

const COMPANY_PHONE_E164 =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_COMPANY_PHONE?.trim() ||
      process.env.COMPANY_PHONE?.trim())) ||
  "+17047714720";

export const COMPANY_PHONE_DISPLAY = (() => {
  const digits = COMPANY_PHONE_E164.replace(/\D/g, "").replace(/^1/, "");
  return digits.length === 10
    ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    : COMPANY_PHONE_E164;
})();

type CompanyPhoneLinkProps = {
  className?: string;
  /** e.g. "Customer service" — shown before the number. Pass an empty string to hide. */
  prefix?: string;
  children?: string;
};

export function CompanyPhoneLink({
  className,
  prefix = "Customer service",
  children,
}: CompanyPhoneLinkProps): ReactElement {
  const display = children ?? COMPANY_PHONE_DISPLAY;
  const label = prefix ? `${prefix}: ${display}` : display;
  return (
    <a href={`tel:${COMPANY_PHONE_E164}`} className={className}>
      {label}
    </a>
  );
}
