from flask import Blueprint, request, jsonify
from extensions import db
from models import Product, Sale
from auth import requires_auth
from payments.factory import get_payment_gateway
from payments.stripe_gateway import StripeGateway
from payments.billplz_gateway import BillplzGateway
from payments.hitpay_gateway import HitPayGateway
import requests

sales_bp = Blueprint("sales", __name__)

@sales_bp.route("/products/<int:product_id>/sell", methods=["POST"])
@requires_auth
def create_sale(product_id):
    product = Product.query.get(product_id)

    if not product:
        return jsonify({"error": "product not found"}), 404
    
    data = request.get_json(silent = True)
    
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400
    
    quantity = data.get("quantity")
    payer_email = data.get("payer_email")

    if not isinstance(quantity, int) or quantity < 1:
        return jsonify({"error": "quantity must be a positive integer"}), 400
    
    if quantity > product.stock_quantity:
        return jsonify({"error": "quantity exceeds available stock"}), 400
    
    if not payer_email or not isinstance(payer_email, str):
        return jsonify({"error": "payer_email is required"}), 400
    
    amount = product.base_price * quantity
    gateway = get_payment_gateway()

    result = gateway.create_payment(
        amount = amount,
        description = f"{quantity} x {product.name}",
        payer_email = payer_email
    )

    sale = Sale(
        product_id = product.id,
        quantity = quantity,
        amount = amount, 
        payer_email = payer_email,
        provider = gateway.provider_name,
        reference_id = result["reference_id"],
        status = "pending"
    )
    db.session.add(sale)
    db.session.commit()

    return jsonify({"checkout_url": result["checkout_url"], "sale_id": sale.id}),201

# Stripe payment gateway
@sales_bp.route("/webhooks/stripe", methods = ["POST"])
def stripe_webhook():
    gateway = StripeGateway()

    try:
        result = gateway.verify_webhook(request)
    except: 
        return jsonify({"error": "Invalid webhook signature"}), 400
    
    sale = Sale.query.filter_by(reference_id = result["reference_id"]).first()

    if not sale:
        return jsonify({"error": "sale not found for this payment"}), 404
    
    if sale.status != "pending":
        return jsonify({"message": "already processed"}), 200
    
    sale.status = result["status"]

    if result["status"] == "paid":
        product = Product.query.get(sale.product_id)
        product.stock_quantity -= sale.quantity
    
    db.session.commit()

    return jsonify({"message": "webhook processed."}), 200


# Billplz payment gateway
@sales_bp.route("/webhooks/billplz", methods=["POST"])
def billplz_webhook():
    gateway = BillplzGateway()

    try:
        result = gateway.verify_webhook(request)
    except ValueError as e:
        return jsonify({"Error": str(e)}), 400
    except requests.RequestException:
        return jsonify({"error": "Could not reach Billplz to confirm payment"}), 502

    sale = Sale.query.filter_by(reference_id=result["reference_id"]).first()
    
    if not sale:
        return jsonify({"Error": "sale not found for this payment"}), 404
    
    if sale.status != "pending":
        return jsonify({"message": "already processed"}), 200
    
    sale.status = result["status"]

    if result["status"] == "paid":
        product = Product.query.get(sale.product_id)
        product.stock_quantity -= sale.quantity

    db.session.commit()

    return jsonify({"message": "webhook processed"}), 200


# HitPay payment gateway
@sales_bp.route("/webhooks/hitpay", methods=["POST"])
def hitpay_webhook():
    gateway = HitPayGateway()

    try:
        result = gateway.verify_webhook(request)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    
    sale = Sale.query.filter_by(reference_id=result["reference_id"]).first()

    if not sale:
        return jsonify({"error": "sale not found for this payment"}), 404
    
    if sale.status != "pending":
        return jsonify({"message": "already processed"}), 200
    
    sale.status = result["status"]

    if result["status"] == "paid":
        product = Product.query.get(sale.product_id)
        product.stock_quantity -= sale.quantity

    db.session.commit()

    return jsonify({"message": "webhook processed"}), 200

@sales_bp.route("/sales/<reference_id>", methods=["GET"])
@requires_auth
def get_sale(reference_id):
    sale = Sale.query.filter_by(reference_id=reference_id).first()

    if not sale:
        return jsonify({"error": "sale not found"}), 404
    
    if sale.status == "pending" and sale.provider == "hitpay":
        gateway = HitPayGateway()
        live_status = gateway.get_payment_status(reference_id)

        if live_status != "pending":
            sale.status = live_status
            if live_status == "paid":
                product = Product.query.get(sale.product_id)
                product.stock_quantity -= sale.quantity
            db.session.commit()

    product = Product.query.get(sale.product_id)

    return jsonify({
        "quantity": sale.quantity,
        "product_name": product.name if product else "Unknown product",
        "status": sale.status
    }), 200