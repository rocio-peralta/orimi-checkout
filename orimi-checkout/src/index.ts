import { Hono } from 'hono'
import { cors } from 'hono/cors'
import stripe, { type Stripe } from 'stripe'
import { Product as Cart } from './models/productModel'
import { UserPrimaryData as User } from './models/userModel'
type Env = {
  API_SECRET_STRIPE: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.post('/create-checkout-session', async (c) => {
  const body: Cart[] = await c.req.json()
  const User: User = await c.req.json()
  // const user:

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = body.map(
    (product) => {
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
            images: [product.image1],
          },
          unit_amount: product.price * 100,
        },
        quantity: product.quantity,
      }
    }
  )

  const stripeInstance = new stripe(c.env.API_SECRET_STRIPE)

  const session = await stripeInstance.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items,
    mode: 'payment',
    customer_email: 'user@gmail.com',
  })

  return c.json({ clientSecret: session.client_secret })
})

export default app
