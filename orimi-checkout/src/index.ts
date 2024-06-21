import { Hono } from 'hono'
import { cors } from 'hono/cors'
import stripe, { type Stripe } from 'stripe'
import { Product as Cart } from './models/productModel'
import { UserPrimaryData as User } from './models/userModel'
type Env = {
  DOMAIN_URL: string
  API_SECRET_STRIPE: string
}

type Body = {
  cart: Cart[]
  user: User
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.post('/create-checkout-session', async (c) => {
  const body: Body = await c.req.json()

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
    body.cart.map((product) => {
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
    })

  const stripeInstance = new stripe(c.env.API_SECRET_STRIPE)

  const session = await stripeInstance.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items,
    mode: 'payment',
    return_url: `${c.env.DOMAIN_URL}/paymentsuccessfull?session_id={CHECKOUT_SESSION_ID}`,
    customer_email: body.user.email,
  })

  return c.json({ clientSecret: session.client_secret })
})

app.get('/session-status', async (c) => {
  const stripeInstance = new stripe(c.env.API_SECRET_STRIPE)
  const session = await stripeInstance.checkout.sessions.retrieve(
    c.req.query('session_id') as string
  )
  console.log('session: ', session)
  return c.json({ session })
})

export default app
