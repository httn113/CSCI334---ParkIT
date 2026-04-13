from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
"""
Core features API which are required user to sign in to use
(JWT access token required)
"""

protected = Blueprint(
    name='protected',
    import_name= __name__,
    url_prefix='/protected'
)

@protected.route("/home", methods=["GET"])
@jwt_required()
def home():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200