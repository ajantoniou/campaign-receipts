import { NextResponse } from 'next/server'
import { createOrGetProduct, createProductVariant, getCheckoutLink } from '@/lib/lemonsqueezy'

/**
 * Initialize Lemon Squeezy products for SEALED book
 * POST /api/lemon-squeezy/products
 */
export async function POST() {
  try {
    // Create SEALED product
    const productData = await createOrGetProduct(
      'SEALED: The 2016 Promises — Before the Deals',
      2200, // $22.00 in cents
      'A historical archive of Trump\'s 2015-2016 campaign promises. PDF, ePub, and Audiobook formats included.'
    )

    const productId = productData.data?.id

    if (!productId) {
      throw new Error('Failed to create product')
    }

    // Create variants for different price points
    const standardVariant = await createProductVariant(
      productId,
      'Standard Edition - $22',
      2200,
      false
    )

    const bundleVariant = await createProductVariant(
      productId,
      'Bundle + Tracking Sheet - $27',
      2700,
      false
    )

    // Get checkout links
    const standardCheckoutLink = getCheckoutLink(standardVariant.data?.id)
    const bundleCheckoutLink = getCheckoutLink(bundleVariant.data?.id)

    return NextResponse.json({
      success: true,
      product: {
        id: productId,
        name: productData.data?.attributes?.name,
        variants: [
          {
            name: 'Standard',
            price: 2200,
            variantId: standardVariant.data?.id,
            checkoutLink: standardCheckoutLink,
          },
          {
            name: 'Bundle',
            price: 2700,
            variantId: bundleVariant.data?.id,
            checkoutLink: bundleCheckoutLink,
          },
        ],
      },
    })
  } catch (error) {
    console.error('Product initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize products', message: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/lemon-squeezy/products
 * Retrieve existing products
 */
export async function GET() {
  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/stores/' + process.env.LEMONSQUEEZY_STORE_ID + '/products', {
      headers: {
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Lemon Squeezy API error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json({ products: data.data || [] })
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', message: String(error) },
      { status: 500 }
    )
  }
}
