from flask import Flask
from database import db
from routes.auth import authentication
from routes.protected import protected
from flask_jwt_extended import JWTManager
from flask_cors import CORS

app = Flask(__name__)
# Browsers treat localhost vs 127.0.0.1 as different origins; Vite may be opened on either.
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///parkIT.db"
app.config["JWT_SECRET_KEY"] = "whateversecretekey"
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

if __name__ == '__main__':
    app.run(debug=True)