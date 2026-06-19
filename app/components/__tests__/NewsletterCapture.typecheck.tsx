import NewsletterCapture from '../NewsletterCapture'

export function InlineReceiptExample() {
  return (
    <NewsletterCapture
      variant="inline-receipt"
      surface="politician"
      sourceSlug="rashida-tlaib"
      heading="Track this politician's donors."
      body="We email you when new donors show up or a vote moves with their money."
      buttonLabel="Watch the money"
    />
  )
}

export function InlineWideExample() {
  return (
    <NewsletterCapture
      variant="inline-wide"
      surface="weekly-page"
      heading="Don't wait for Monday. Read it in your inbox."
      body="Same Friday email. Three sections: new donors, donor-moved votes, donor-moved bills."
      buttonLabel="Get Friday's email"
    />
  )
}

export function FooterDarkExample() {
  return (
    <NewsletterCapture
      variant="footer-dark"
      surface="footer"
      heading="Headlines only."
      body="New bills, new donations, new broken promises."
      buttonLabel="Get Friday's receipt"
    />
  )
}
