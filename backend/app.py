from flask import Flask
from database import db
from routes.auth import authentication
from routes.protected import protected
from routes.admin_routes import admin_bp
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import re

app = Flask(__name__)
# Browsers treat localhost vs 127.0.0.1 as different origins; Vite may be opened on either.
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///parkIT.db"
app.config["JWT_SECRET_KEY"] = "whateversecretekey"

# Vite defaults to 5173; if that port is taken it serves on 5174, 5175, … Same for localhost vs 127.0.0.1.
CORS(app, origins=[
    re.compile(r"http://(?:localhost|127\.0\.0\.1):(517[3-9]|518\d|519\d)"),
    re.compile(r"https://.*\.vercel\.app"),
])

"""
Initialising the database and jwt
"""
db.init_app(app)
with app.app_context():
    db.create_all()
jwt = JWTManager(app)

"""
Initialising the route for different apis
"""
app.register_blueprint(authentication)
app.register_blueprint(protected)
app.register_blueprint(admin_bp)
if __name__ == '__main__':
    app.run(debug=True, port=5001)