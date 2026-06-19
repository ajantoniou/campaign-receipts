export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-300">404</p>
        <h1 className="text-4xl font-bold">Page not found</h1>
        <p className="text-slate-300 max-w-lg">
          Nothing to see here yet. Head back to the front door, and we will
          welcome you shortly.
        </p>
      </div>
    </main>
  )
}
