from flask import Flask
from database import db
from routes.auth import authentication
from routes.protected import protected
from flask_jwt_extended import JWTManager
from flask_cors import CORS

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///parkIT.db"
app.config["JWT_SECRET_KEY"] = "whateversecretekey"
CORS(app, origins=["http://localhost:5173"])
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