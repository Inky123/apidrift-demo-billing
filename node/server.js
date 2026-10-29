const express = require('express');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-08-26.dahlia',
});

const app = express();
app.use(express.json());

// Move a subscription's billing date to today when the customer upgrades.
app.post('/subscriptions/:id/upgrade', async (req, res) => {
  const subscription = await stripe.subscriptions.update(req.params.id, {
    items: [{ id: req.body.itemId, price: req.body.priceId }],
    billing_cycle_anchor: 'now',
    proration_behavior: 'create_prorations',
  });
  res.json({ id: subscription.id, status: subscription.status });
});

// Resume a paused subscription without moving its billing date.
app.post('/subscriptions/:id/resume', async (req, res) => {
  const subscription = await stripe.subscriptions.resume(req.params.id, {
    billing_cycle_anchor: 'unchanged',
  });
  res.json({ id: subscription.id, status: subscription.status });
});

// Show what the first invoice of a plan starting on a given date will look like.
app.post('/invoices/preview', async (req, res) => {
  const invoice = await stripe.invoices.createPreview({
    customer: req.body.customerId,
    subscription_details: {
      items: [{ price: req.body.priceId }],
      billing_cycle_anchor: 1798761600,
    },
  });
  res.json({ total: invoice.total, currency: invoice.currency });
});

// Update the billing details on a saved PayTo payment method.
app.post('/payment-methods/:id', async (req, res) => {
  const paymentMethod = await stripe.paymentMethods.update(req.params.id, {
    billing_details: { name: req.body.name, email: req.body.email },
    payto: { pay_id: req.body.payId },
  });
  res.json({ id: paymentMethod.id });
});

// Start a bank-account link for a customer in the United States.
app.post('/bank-links', async (req, res) => {
  const session = await stripe.financialConnections.sessions.create({
    account_holder: { type: 'customer', customer: req.body.customerId },
    permissions: ['balances', 'payment_method'],
    filters: { countries: ['US'] },
  });
  res.json({ clientSecret: session.client_secret });
});

app.listen(4242, () => console.log('billing service on 4242'));
