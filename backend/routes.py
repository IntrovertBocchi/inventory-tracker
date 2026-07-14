from flask import Blueprint, request, jsonify
from extensions import db
from models import Product
from auth import requires_auth
import requests

products_bp = Blueprint("products", __name__)

@products_bp.route("/products", methods=["POST"])
@requires_auth
def create_product():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400
    
    name = data.get("name")

    # SKUs are normalized to uppercase before storing or comparing them.
    # Without this, "WID-005" and "wid-005" would be treated as two different
    # products, even though they almost certainly refer to the same item -
    # just typed with different casing by whoever filled in the form.
    sku = data.get("sku")
    if isinstance(sku, str):
        sku = sku.strip().upper()
    stock_quantity = data.get("stock_quantity")
    base_price = data.get("base_price")
    MAX_NAME_LENGTH = 120
    MAX_SKU_LENGTH = 50

    # These ceilings exist to catch obviously mistaken input (an extra typed
    # digit, a copy-paste error), not to restrict legitimate business use.
    # A small retailer realistically never holds a million units of one item
    # or prices a single item above a million MYR - anything past this is
    # far more likely a data-entry mistake than a real transaction.
    MAX_STOCK_QUANTITY = 1_000_000
    MAX_BASE_PRICE = 1_000_000

    if not name or not isinstance(name, str):
        return jsonify({"error": "name is required and must be a string"}), 400
    
    if not sku or not isinstance(sku, str):
        return jsonify({"error": "sku is required and must be a non-negative integer"}), 400
    
    if stock_quantity is None or not isinstance(stock_quantity, int) or stock_quantity < 0:
        return jsonify({"error": "stock_quantity is required and must be a non-negative integer"}), 400
    
    if base_price is None or not isinstance(base_price, (int, float)) or base_price < 0:
        return jsonify({"error": "base_price is required and must be a non-negative number"}), 400
    
    # Product names are intentionally allowed to repeat - e.g two different
    # variants both called "Widget 4" (a red one and a blue one) are normal 
    # in real inventory systems. SKU is what has to stay unique, not the name.
    if Product.query.filter_by(sku=sku).first():
        return jsonify({"error": "a product with this sku already exists"}), 409
    
    if len(name) > MAX_NAME_LENGTH:
        return jsonify({"error": f"name must be {MAX_NAME_LENGTH} characters or fewer"}), 400
    
    if len(sku) > MAX_SKU_LENGTH:
        return jsonify({"error": f"sku must be {MAX_SKU_LENGTH} characters or fewer"}), 400
    
    if stock_quantity > MAX_STOCK_QUANTITY:
        return jsonify({"error": f"stock_quantity must be {MAX_STOCK_QUANTITY} or fewer"}), 400

    if base_price > MAX_BASE_PRICE:
        return jsonify({"error": f"base_price must be {MAX_BASE_PRICE} or less"}), 400

    product = Product(
        name=name,
        sku=sku,
        stock_quantity=stock_quantity,
        base_price=base_price
    )

    db.session.add(product)
    db.session.commit()

    return jsonify(product.to_dict()), 201


@products_bp.route("/products", methods=["GET"])
@requires_auth
def get_products():
    products = Product.query.all()
    return jsonify([product.to_dict() for product in products]), 200

@products_bp.route("/products/<int:product_id>", methods=["PUT"])
@requires_auth
def update_product(product_id):
    product = Product.query.get(product_id)

    if not product:
        return jsonify({"error": "product not found."}), 404
    
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400
    
    if "name" in data:
        if not data["name"] or not isinstance(data["name"], str):
            return jsonify({"error": "name must be a non-empty string"}), 400
        product.name = data["name"]
    
    if "sku" in data:
        sku = data["sku"]
        if isinstance(sku, str):
            sku = sku.strip().upper()
        if not sku:
            return jsonify({"error": "sku must not be a non-empty string"}), 400
        
        # A product editing its own SKU without changing it will always "find"
        # itself in this query - that's expected, not a conflict. We only treat
        # it as a real duplicate if a DIFFERENT product already owns the SKU.
        existing = Product.query.filter_by(sku = sku).first()
        if existing and existing.id != product.id:
            return jsonify({"error": "a product with this sku already exists"}), 409
        product.sku = sku

    if "stock_quantity" in data:
        if not isinstance(data["stock_quantity"], int) or data["stock_quantity"] < 0:
            return jsonify({"error": "stock_quantity must be a non-negative integer"}), 400
        product.stock_quantity = data["stock_quantity"]

    if "base_price" in data:
        if not isinstance(data["base_price"], (int, float)) or data["base_price"] < 0:
            return jsonify({"error": "base_price must be a non-negative number"}), 400
        product.base_price = data["base_price"]

    db.session.commit()

    return jsonify(product.to_dict()), 200

@products_bp.route("/products/<int:product_id>", methods=["DELETE"])
@requires_auth
def delete_product(product_id):
    product = Product.query.get(product_id)

    if not product:
        return jsonify({"error": "product not found"}), 404

    db.session.delete(product)
    db.session.commit()

    return jsonify({"message": f"product {product_id} deleted"}), 200

@products_bp.route("/convert", methods=["GET"]) 
@requires_auth
def convert_currency():
    target_currency = request.args.get("to")

    if not target_currency:
        return jsonify({"error": "Query parameter 'to' is required."}), 400
    
    try:
        response = requests.get(
            "https://api.frankfurter.app/latest",
            params={"from": "MYR", "to": target_currency}
        )
    except requests.RequestException:
        return jsonify({"error": "Currency Service Unavailable."}), 502
    
    if response.status_code != 200:
        return jsonify({"error": "Invalid currency code"}), 400
    
    data = response.json()
    rate = data.get("rates", {}).get(target_currency)

    if rate is None:
        return jsonify({"error": "Invalid currency code"}), 400
    
    return jsonify ({"from": "MYR", "to": target_currency, "rate": rate}), 200

