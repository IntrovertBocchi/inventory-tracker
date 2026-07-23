import os
import requests
from payments.base import PaymentGateway

class BillplzGateway(PaymentGateway):

    provider_name = "billplz"
    
    def __init__(self):
        self.secret_key = os.environ.get("BILLPLZ_SECRET_KEY", "").strip()
        self.x_signature_key = os.environ.get("BILLPLZ_X_SIGNATURE_KEY", "").strip()
        self.collection_id = os.environ.get("BILLPLZ_COLLECTION_ID", "").strip()
        self.api_base = os.environ.get("BILLPLZ_API_BASE", "").strip()
        self.callback_base = os.environ.get("BILLPLZ_CALLBACK_BASE", "").strip()
        self.frontend_url = os.environ.get("FRONTEND_URL", "").strip()

    def create_payment(self, amount, description, payer_email):
        # Billplz expects amount in cents (smallest currency unit),
        # same convention as Stripe - RM45.90 must be sent as 4590.
        amount_in_cents = int(round(amount * 100))

        response = requests.post(
            f"{self.api_base}/bills",
            auth = (self.secret_key, ""),
            data = {
                "collection_id": self.collection_id,
                "email": payer_email,
                "name": payer_email,
                "amount": amount_in_cents,
                "description": description[:200],
                "callback_url": f"{self.callback_base}/webhooks/billplz",
                "redirect_url": f"{self.frontend_url}/products",
            }
        )
        response.raise_for_status()
        data = response.json()

        return {"checkout_url": data["url"], "reference_id": data["id"]}
    
    def verify_webhook(self, request):
        # We deliberately do NOT trust the x_signature or any other field
        # in the webhook's own POST body - a forged request could claim
        # anything. Instead, we treat the webhook purely as a "something
        # happened, go check" trigger: we take only the bill ID from it,
        # then make our own authenticated request back to Billplz's API 
        # (using our secret key, the same way create_payment does) to get
        # the real, trustworthy status from Billplz's servers.
        params = request.form.to_dict()
        bill_id = params.get("id")

        if not bill_id:
            raise ValueError("Webhook payload missing bill id")
        
        response = requests.get(
            f"{self.api_base}/bills/{bill_id}",
            auth=(self.secret_key, "")
        )

        if response.status_code == 404:
            raise ValueError(f"Bill {bill_id} not found on Billplz")
        
        response.raise_for_status()
        bill = response.json()

        status = "paid" if bill.get("paid") is True else "failed"

        return {"reference_id": bill["id"], "status": status}
