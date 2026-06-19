import { redirect } from 'next/navigation'

/** The 5-page sample is retired now that the full edition is live. Redirect to pricing. */
export default function SamplePage() {
  redirect('/#compare')
}
