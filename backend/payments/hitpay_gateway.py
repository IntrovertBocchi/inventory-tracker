import os
import hmac
import hashlib
import requests
from .base import PaymentGateway

class HitPayGateway(PaymentGateway):

    provider_name = "hitpay"
    
    def __init__(self):
        self.api_key = os.environ.get("HITPAY_API_KEY")
        self.salt = os.environ.get("HITPAY_SALT")
        self.api_base = os.environ.get("HITPAY_BASE_URL")
        self.frontend_url = os.environ.get("FRONTEND_URL")
        self.webhook_salt = os.environ.get("HITPAY_WEBHOOK_SALT")

    def create_payment(self, amount, description, payer_email):
        # Unlike Stripe, HitPay takes the amount in normal decimal form.
        # RM 45.90 is sent as 45.90, not converted to sen.
        response = requests.post(
            f"{self.api_base}/payment-requests",
            headers={"X-BUSINESS-API-KEY": self.api_key},
            json={
                "amount": amount,
                "currency": "MYR",
                "email": payer_email,
                "name": payer_email,
                "purpose": description,
                "redirect_url": f"{self.frontend_url}/products",
            },
        )
        response.raise_for_status()
        data = response.json()

        return{"checkout_url": data["url"], "reference_id": data["id"]}
    
    def verify_webhook(self, request):
        raw_body = request.get_data()
        received_signature = request.headers.get("Hitpay-signature", "")

        computed_signature = hmac.new(
            self.webhook_salt.encode("utf-8"),
            raw_body,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(computed_signature, received_signature):
            raise ValueError("HitPay webhook signature verification failed")
        
        payload = request.get_json()
        reference_id = payload.get("id")
        status = "paid" if payload.get("status") == "completed" else "failed"

        return {"reference_id": reference_id, "status": status}
    
    def get_payment_status(self, reference_id):
        response = requests.get(
            f"{self.api_base}/payment-requests/{reference_id}",
            headers = {"X-BUSINESS-API-KEY": self.api_key},
        )
        response.raise_for_status()
        data = response.json()

        return "paid" if data["status"] == "completed" else data["status"]

