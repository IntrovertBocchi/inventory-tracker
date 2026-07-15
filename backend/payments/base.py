from abc import ABC, abstractmethod

class PaymentGateway(ABC):
    """
    The shared contract every payment provider must follow. Routes in the
    rest of the app only ever talk to this interface - never to Stripe or
    Billplz directly - so switching providers later means writing a new 
    class that follows this same shape, not rewriting any routes.
    """

    @abstractmethod
    def create_payment(self, amount, description, payer_email):
        """
        Starts a new payment for the given amount (in MYR, as a float)
        and returns a dict: {"checkout_url": str, "reference_id": str}.

        checkout_url is where the frontend should redirect the user to 
        actually pay. reference_id is the provider's own ID for this 
        payment, which we'll store so we can look it up again later
        (e.g. when a webhook arrives confirming it was paid).
        """

        raise NotImplementedError
    
    @abstractmethod
    def verify_webhook(self, request):
        """
        Confirms an incoming webhook request genuinely came from this
        provider (not someone faking a "payment succeeded" call), and
        returns the payment's reference_id and its status ("paid" or 
        "failed") if valid. Raises an exception if verification fails.
        """

        raise NotImplementedError