export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <a href="/" className="text-sm text-muted hover:text-foreground transition-colors">&larr; Back to Cliros</a>
        <h1 className="text-3xl font-bold text-foreground mt-6 mb-8">Privacy Policy</h1>
        <div className="prose prose-sm text-muted space-y-6 text-[14px] leading-relaxed">
          <p><strong>Effective Date:</strong> May 17, 2026</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">1. Information We Collect</h2>
          <p><strong>Account information:</strong> When you create an account, we collect your name, email address, bar number (optional), firm name, and contact information.</p>
          <p><strong>Search data:</strong> We collect the property addresses you search and the reports generated. This data is stored to provide your report history and improve our service.</p>
          <p><strong>Payment information:</strong> Payment is processed by LemonSqueezy. We do not store credit card numbers or bank account details. We receive transaction confirmation and order IDs.</p>
          <p><strong>Usage data:</strong> We collect standard analytics data including pages visited, features used, and time spent in the application.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide and improve the Cliros title search service</li>
            <li>Generate and store your title search reports</li>
            <li>Process payments</li>
            <li>Send service-related communications (account updates, report delivery)</li>
            <li>Respond to support requests</li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground mt-8">3. Data Sharing</h2>
          <p>We do not sell your personal information. We share data only with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Service providers:</strong> Supabase (database hosting), LemonSqueezy (payment processing), and infrastructure providers necessary to operate the service</li>
            <li><strong>Public records sources:</strong> We query GSCCCA and court databases on your behalf using the property addresses you provide</li>
            <li><strong>Legal requirements:</strong> We may disclose information if required by law or legal process</li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground mt-8">4. Data Storage & Security</h2>
          <p>Your data is stored securely using Supabase (hosted on AWS). We use encryption in transit (TLS) and at rest. Access to production data is limited to authorized personnel only.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">5. Data Retention</h2>
          <p>Your account data and reports are retained for as long as your account is active. You may request deletion of your account and associated data at any time by contacting support@cliros.ai.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your reports</li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground mt-8">7. Cookies</h2>
          <p>We use essential cookies for authentication and session management. We do not use third-party advertising cookies.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">8. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of material changes via email or through the application.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">9. Contact</h2>
          <p>Questions about privacy? Contact us at <a href="mailto:support@cliros.ai" className="text-accent hover:underline">support@cliros.ai</a>.</p>
        </div>
      </div>
    </div>
  );
}
