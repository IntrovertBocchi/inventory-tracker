from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from auth import requires_auth
from extensions import db
from routes import products_bp
from sales_routes import sales_bp
import os

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///inventory.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

app.register_blueprint(products_bp)
app.register_blueprint(sales_bp)

@app.route("/api/ping")
@requires_auth
def ping():
    return {"message": "You are authenticated!"}
 
if __name__ == '__main__':
    
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug_mode, port=5000)