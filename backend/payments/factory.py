import os

def get_payment_gateway():
    """
    Returns whichever payment gateway is currently configured via the
    PAYMENT_PROVIDER env var. This is the one place in the app that knows
    which specific provider is active - everywhere else just calls the returned
    object's create_payment/verify_webhook methods.
    """
    provider=os.environ.get("PAYMENT_PROVIDER", "stripe").lower()

    if provider == "stripe":
        from payments.stripe_gateway import StripeGateway
        return StripeGateway()
    
    if provider == "billplz":
        from payments.billplz_gateway import BillplzGateway
        return BillplzGateway()
    
    raise ValueError(f"Unknown PAYMENT_PROVIDER: {provider}")