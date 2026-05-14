from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token

bcrypt = Bcrypt()

def hash_password(password):
    return bcrypt.generate_password_hash(password).decode("utf-8")

def check_password(password, hashed_password):
    return bcrypt.check_password_hash(hashed_password, password)

def generate_token(user_id):
    return create_access_token(identity=str(user_id))