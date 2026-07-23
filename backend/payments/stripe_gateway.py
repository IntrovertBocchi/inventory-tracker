import os
import stripe
from payments.base import PaymentGateway

class StripeGateway(PaymentGateway):

    provider_name = "stripe"
    
    def __init__(self):
        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
        self.webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
        self.frontend_url = os.environ.get("FRONTEND_URL")

    def create_payment(self, amount, description, payer_email):
        # Stripe expects amounts in the smallest currency unit - for MYR,
        # that's sen (cents), not ringgit. RM 45.90 must be sent as 4590.
        amount_in_sen = int(round(amount * 100))

        session = stripe.checkout.Session.create(
            mode = "payment",
            payment_method_types = ["card"],
            line_items = [{
                "price_data": {
                    "currency": "myr",
                    "product_data": {"name": description},
                    "unit_amount": amount_in_sen,
                },
                "quantity": 1,
            }],
            customer_email = payer_email,
            success_url = f"{self.frontend_url}/products?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url = f"{self.frontend_url}/products?payment=cancelled",
        )

        return {"checkout_url": session.url, "reference_id": session.id}
    
    def verify_webhook(self, request):
        payload = request.data
        sig_header = request.headers.get("Stripe-Signature")

        event = stripe.Webhook.construct_event(
            payload, sig_header, self.webhook_secret
        )

        session = event["data"]["object"]
        reference_id = session["id"]

        if event["type"] == "checkout.session.completed":
            status = "paid"
        
        else:
            status = "failed"

        return {"reference_id": reference_id, "status": status}