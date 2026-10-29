import os

import stripe
from flask import Flask, jsonify, request

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
stripe.api_version = "2026-08-26.dahlia"

app = Flask(__name__)


@app.post("/subscriptions/<subscription_id>/upgrade")
def upgrade(subscription_id):
    """Move the billing date to today when the customer upgrades."""
    body = request.get_json()
    subscription = stripe.Subscription.modify(
        subscription_id,
        items=[{"id": body["item_id"], "price": body["price_id"]}],
        billing_cycle_anchor={"type": "now"},
        proration_behavior="create_prorations",
    )
    return jsonify(id=subscription.id, status=subscription.status)


@app.post("/subscriptions/<subscription_id>/resume")
def resume(subscription_id):
    """Resume a paused subscription without moving its billing date."""
    subscription = stripe.Subscription.resume(subscription_id, billing_cycle_anchor={"type": "unchanged"})
    return jsonify(id=subscription.id, status=subscription.status)


@app.post("/payment-methods/<payment_method_id>")
def update_payment_method(payment_method_id):
    """Update the billing details on a saved PayTo payment method."""
    body = request.get_json()
    payment_method = stripe.PaymentMethod.modify(
        payment_method_id,
        billing_details={"name": body["name"], "email": body["email"]},
    )
    return jsonify(id=payment_method.id)


@app.post("/bank-links")
def bank_link():
    """Start a bank-account link for a customer in the United States."""
    body = request.get_json()
    session = stripe.financial_connections.Session.create(
        account_holder={"type": "customer", "customer": body["customer_id"]},
        permissions=["balances", "payment_method"],
        filters={"country": "US"},
    )
    return jsonify(client_secret=session.client_secret)
