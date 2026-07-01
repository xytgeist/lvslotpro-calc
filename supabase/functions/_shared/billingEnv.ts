/** Maps product slug to Edge secret name, e.g. slots-edge → STRIPE_PRICE_SLOTS_EDGE */
export function stripePriceSecretForProduct(productSlug: string): string {
  const envKey = `STRIPE_PRICE_${productSlug.toUpperCase().replace(/-/g, '_')}`
  const priceId = Deno.env.get(envKey)?.trim()
  if (!priceId) {
    throw new Error(`Missing Edge secret ${envKey} for product "${productSlug}".`)
  }
  return priceId
}

export function requireStripeSecretKey(): string {
  const key = Deno.env.get('STRIPE_SECRET_KEY')?.trim()
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY Edge secret.')
  return key
}

export function requireStripeWebhookSecret(): string {
  const key = Deno.env.get('STRIPE_WEBHOOK_SECRET')?.trim()
  if (!key) throw new Error('Missing STRIPE_WEBHOOK_SECRET Edge secret.')
  return key
}

export function checkoutReturnUrls(req: Request, productSlug: string) {
  const origin =
    req.headers.get('origin')?.trim() ||
    Deno.env.get('STRIPE_CHECKOUT_DEFAULT_ORIGIN')?.trim() ||
    'http://localhost:5173'
  const base = origin.replace(/\/+$/, '')
  return {
    success_url: `${base}/?billing=success&product=${encodeURIComponent(productSlug)}`,
    cancel_url: `${base}/?billing=cancel&product=${encodeURIComponent(productSlug)}`,
  }
}
