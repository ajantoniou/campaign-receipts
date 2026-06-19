export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <a href="/" className="text-sm text-muted hover:text-foreground transition-colors">&larr; Back to Cliros</a>
        <h1 className="text-3xl font-bold text-foreground mt-6 mb-8">Terms of Service</h1>
        <div className="prose prose-sm text-muted space-y-6 text-[14px] leading-relaxed">
          <p><strong>Effective Date:</strong> May 17, 2026</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">1. Service Description</h2>
          <p>Cliros provides automated property title search and analysis tools for licensed attorneys in the state of Georgia. Our service searches publicly available records from GSCCCA, federal courts, and other public databases, and generates reports and draft Attorney Opinion Letters (AOLs) for attorney review.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">2. Not Legal Advice</h2>
          <p>Cliros is a data and analysis tool. It does not provide legal advice, legal opinions, or title insurance. All reports and draft AOLs are generated for attorney review only. The reviewing attorney verifies the findings, exercises professional judgment, and issues any legal opinions.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">3. Account & Eligibility</h2>
          <p>You must be a licensed attorney or authorized representative of a law firm to use Cliros for professional purposes. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">4. Free Trial & Pricing</h2>
          <p>New accounts receive a limited number of free title search reports. After the free trial, reports are available for $200 each, payable via our payment processor at the time of purchase. Prices are subject to change with notice.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">5. Data Accuracy</h2>
          <p>Cliros searches publicly available databases and presents the results as-is. While we strive for completeness and accuracy, we do not guarantee that all records have been found or that the data is error-free. Public records may be incomplete, delayed, or contain errors at the source. The attorney bears responsibility for verifying all data before relying on it.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">6. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Cliros shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the service.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">7. Intellectual Property</h2>
          <p>The Cliros platform, including its design, code, and branding, is the property of Cliros. Reports generated through the service are licensed to you for your professional use. Public records data contained in reports remains in the public domain.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">8. Termination</h2>
          <p>We may suspend or terminate your access to Cliros at any time for violation of these terms or for any other reason at our discretion. You may cancel your account at any time by contacting support@cliros.ai.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">9. Changes to Terms</h2>
          <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>

          <h2 className="text-lg font-semibold text-foreground mt-8">10. Contact</h2>
          <p>Questions about these terms? Contact us at <a href="mailto:support@cliros.ai" className="text-accent hover:underline">support@cliros.ai</a>.</p>
        </div>
      </div>
    </div>
  );
}
