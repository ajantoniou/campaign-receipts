/**
 * Lemon Squeezy API helper
 * Handles product creation and payment links
 */

const LEMONSQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1'
const API_KEY = process.env.LEMONSQUEEZY_API_KEY
const STORE_ID = process.env.LEMONSQUEEZY_STORE_ID

export interface LemonSqueezyProduct {
  id: string
  name: string
  price: number
  description?: string
  productId?: string
}

/**
 * Get a product from Lemon Squeezy by name (read-only)
 *
 * NOTE: Lemon Squeezy API does NOT support programmatic product creation.
 * Products MUST be created manually via the LS dashboard at:
 * https://app.lemonsqueezy.com/dashboard
 *
 * This function only supports listing/finding existing products.
 */
export async function createOrGetProduct(
  name: string,
  _price: number, // in cents (reserved for future use)
  _description?: string
): Promise<any> {
  if (!API_KEY || !STORE_ID) {
    throw new Error('Lemon Squeezy API key or store ID not configured')
  }

  try {
    // List existing products to find by name
    const listResponse = await fetch(`${LEMONSQUEEZY_API_BASE}/stores/${STORE_ID}/products`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json',
      },
    })

    if (listResponse.ok) {
      const listData = await listResponse.json()
      const existing = listData.data?.find((p: any) => p.attributes?.name === name)
      if (existing) {
        return { data: existing }
      }
    }

    // Product not found and creation is not supported via API
    throw new Error(
      `Product "${name}" not found in Lemon Squeezy.\n` +
      'Lemon Squeezy API does not support programmatic product creation.\n' +
      'Please create the product manually via: https://app.lemonsqueezy.com/dashboard\n' +
      'Then use getCheckoutLink() with the variant ID.'
    )
  } catch (error) {
    console.error('Lemon Squeezy product lookup error:', error)
    throw error
  }
}

/**
 * Create a variant (price tier) for a product
 *
 * NOTE: Variant creation requires that the product already exists in Lemon Squeezy.
 * Products must be created manually via the LS dashboard:
 * https://app.lemonsqueezy.com/dashboard
 *
 * This function is included for completeness but should rarely be called in v1.
 * For the initial SEALED launch, variants should be created in the dashboard
 * alongside the product.
 */
export async function createProductVariant(
  productId: string,
  name: string,
  price: number, // in cents
  isSubscription: boolean = false
): Promise<any> {
  if (!API_KEY) {
    throw new Error('Lemon Squeezy API key not configured')
  }

  try {
    const response = await fetch(`${LEMONSQUEEZY_API_BASE}/products/${productId}/variants`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'variants',
          attributes: {
            name,
            price,
            is_subscription: isSubscription,
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create variant: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Lemon Squeezy variant error:', error)
    throw error
  }
}

/**
 * Get checkout link for a variant
 *
 * Lemon Squeezy supports sandbox testing via query parameter.
 * For production: use the regular checkout URL
 * For testing: append `?checkout[custom][test]=true` to trigger sandbox mode
 *
 * @param variantId - The LS variant ID (numeric, from dashboard)
 * @param sandbox - If true, appends sandbox test parameter (default: false for production)
 * @returns The LS checkout URL
 */
export function getCheckoutLink(variantId: string, sandbox: boolean = false): string {
  const baseUrl = `https://demiurgiclabs.lemonsqueezy.com/checkout/buy/${variantId}`
  if (sandbox) {
    return `${baseUrl}?checkout[custom][test]=true`
  }
  return baseUrl
}
