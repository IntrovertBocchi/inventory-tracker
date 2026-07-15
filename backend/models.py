from extensions import db
from datetime import datetime

class Product(db.Model):
    """
    Represents one item in the inventory. Matches exactly what the
    business scoped for this build: a name, a unique SKU code, how many
    units are currently in stock, and the base price in MYR (Malaysian Ringgit)
    - the store's home currency. Prices in other currencies are calculated on
    the fly when displayed, never stored.
    """
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(120), nullable = False)
    
    # unique=True is a database-level safety net; the real duplicate check
    # (case-insensitive, with a clear error message) happens in routes.py
    sku = db.Column(db.String(50), unique = True, nullable = False)

    stock_quantity = db.Column(db.Integer, nullable = False, default = 0)
    base_price = db.Column(db.Float, nullable = False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "sku": self.sku,
            "stock_quantity": self.stock_quantity,
            "base_price": self.base_price
        }
    
class Sale(db.Model):
    """
    One record per attempted sale. Created as "pending" the moment a
    payment session starts, then updated to "paid" or "failed" once the
    payment provider's webhook confirms the outcome. Stock is only ever
    decremented once a sale is confirmed "paid" - never at creation time,
    since the customer may abandon or fail the actual payment.
    """
    id = db.Column(db.Integer, primary_key = True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable = False)
    quantity = db.Column(db.Integer, nullable = False)
    amount = db.Column(db.Float, nullable = False)
    payer_email = db.Column(db.String(255), nullable = False)
    provider = db.Column(db.String(50), nullable = False)
    reference_id = db.Column(db.String(255), unique = True, nullable = False, index = True)
    status = db.Column(db.String(20), nullable = False, default = "pending")
    created_at = db.Column(db.DateTime, nullable = False, default = datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "amount": self.amount,
            "payer_email": self.payer_email,
            "provider": self.provider,
            "status": self.status,
            "created_at": self.created_at.isoformat()
        }
