export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-parchment-100 text-ink-900 flex flex-col items-center justify-center px-6 py-16">
      <div className="text-center space-y-4 max-w-2xl">
        <p className="sealed-eyebrow-quiet">404</p>
        <h1 className="font-serif text-4xl font-bold text-ink-900">We couldn’t find that page.</h1>
        <div className="gold-rule mx-auto max-w-[8rem]" aria-hidden />
        <p className="font-serif text-lg text-ink-700">
          SEALED Press is a tightly curated archive—this route either moved or never existed. Head back home and keep exploring.
        </p>
      </div>
    </main>
  )
}
