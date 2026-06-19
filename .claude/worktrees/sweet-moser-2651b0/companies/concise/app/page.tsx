export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-white mb-4">Concise Books</h1>
        <p className="text-xl text-slate-300 mb-8">Direct-sale platform launching soon.</p>

        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Coming Soon</h2>
          <p className="text-slate-600 mb-6">
            Join our mailing list to be notified when we launch.
          </p>

          <form
            method="POST"
            action="/api/email/subscribe"
            className="space-y-4"
          >
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="first_name"
              placeholder="Your name (optional)"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Notify Me
            </button>
          </form>

          <p className="text-xs text-slate-500 mt-4">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </main>
  )
}
