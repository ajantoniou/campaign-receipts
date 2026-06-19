import { NextPageContext } from 'next'

type ErrorProps = {
  statusCode?: number
}

export default function PagesError({ statusCode }: ErrorProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center text-center px-6 space-y-4">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
        {statusCode ? `Error ${statusCode}` : 'Error'}
      </p>
      <h1 className="text-4xl font-semibold">Something went wrong</h1>
      <p className="max-w-xl text-slate-300">
        We were unable to render the requested page. Refresh the browser or return
        to the home screen to continue.
      </p>
    </main>
  )
}

PagesError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode || err?.statusCode
  return { statusCode }
}
