import NewsletterCapture from './NewsletterCapture'

export default function FridayReceiptsFooterForm() {
  return (
    <NewsletterCapture
      variant="footer-dark"
      surface="footer"
      heading="Who paid to write the bill?"
      body="Each week we name the donors behind a bill — and the votes they bought."
      buttonLabel="Get the newsletter"
    />
  )
}
