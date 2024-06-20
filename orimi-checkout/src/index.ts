import { Hono } from 'hono'
import { cors } from 'hono/cors'
import stripe, { type Stripe } from 'stripe'
import { Product as Cart } from './models/productModel'
import { UserPrimaryData as User } from './models/userModel'
type Env = {
  API_SECRET_STRIPE: string
}

type Body = {
  cart: Cart[]
  user: User
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const LOCAL_DOMAIN = 'http://localhost:5173'

const DOMAIN = 'https://orimi-develop.vercel.app'

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
    return_url: `${LOCAL_DOMAIN}/paymentsuccessfull?session_id={CHECKOUT_SESSION_ID}`,
    customer_email: body.user.email,
  })

  return c.json({ clientSecret: session.client_secret })
})

app.get('/session-status', async (c) => {
  const stripeInstance = new stripe(c.env.API_SECRET_STRIPE)
  // return c.json({ session: c.req.query('session_id') })

  const session = await stripeInstance.checkout.sessions.retrieve(
    c.req.query('session_id') as string
  )
  console.log('session: ', session)
  return c.json({ session})
})

export default app

// app.get('/profile/orders', async (c) => {
//   // const body: Body = await c.req.json()
//   const stripeInstance = new stripe(c.env.API_SECRET_STRIPE, {
//     apiVersion: '2024-04-10',
//   })

//   try {
//     const orders = await stripeInstance.checkout.sessions.list({
//       limit: 3,
//     })
//     return c.json(orders.data)
//   } catch (error) {
//     console.error('Error fetching orders:', error)
//     return c.json({ error: 'Failed to fetch orders' }, 500)
//   }
// })

// // Nueva ruta para obtener los detalles de un pedido específico
// app.get('/profile/orders/:orderId', async (c) => {
//   const { orderId } = c.req.param()
//   const stripeInstance = new stripe(c.env.API_SECRET_STRIPE, {
//     apiVersion: '2024-04-10',
//   })

//   try {
//     const session = await stripeInstance.checkout.sessions.retrieve(orderId, {
//       expand: ['line_items.data.price.product'],
//     })

//     if (!session || !session.line_items) {
//       return c.json({ error: 'Order not found' }, 404)
//     }

//     // Estructura de datos del pedido
//     const order = {
//       id: session.id,
//       created: session.created,
//       amount_total: session.amount_total,
//       currency: session.currency,
//       items: session.line_items.data.map((item) => {
//         const product = item.price?.product as Stripe.Product | undefined
//         return {
//           id: item.id,
//           name: item.description,
//           quantity: item.quantity,
//           price: item.amount_total,
//           image1: product?.images[0] ?? '',
//         }
//       }),
//     }

//     return c.json(order)
//   } catch (error) {
//     console.error('Error fetching order:', error)
//     return c.json({ error: 'Failed to fetch order' }, 500)
//   }
// })
