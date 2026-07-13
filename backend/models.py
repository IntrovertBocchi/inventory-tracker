from extensions import db

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