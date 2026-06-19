import {
  buildConfirmationUrl,
  normalizeNewsletterSignup,
} from '../newsletter-signup'

const validSignup = normalizeNewsletterSignup({
  email: 'Reader@Example.COM ',
  source: 'article',
  source_slug: 'aipac-money-trail',
  website: '',
})

if (!validSignup.ok) {
  throw new Error('expected valid newsletter signup')
}

const normalizedEmail: string = validSignup.value.email
const normalizedSource = validSignup.value.source

const invalidSignup = normalizeNewsletterSignup({
  email: 'not-an-email',
  source: 'article',
})

if (invalidSignup.ok) {
  throw new Error('expected invalid newsletter signup')
}

buildConfirmationUrl({
  email: normalizedEmail,
  baseUrl: 'https://campaignreceipts.com',
  secret: 'test-secret',
  source: normalizedSource,
})
