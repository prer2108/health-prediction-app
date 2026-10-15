
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy.exc import IntegrityError
import math
import re

app = Flask(__name__)
CORS(app)

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///patients.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# User account model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(100), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)


# Patient model
class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    dob = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    glucose = db.Column(db.Float, nullable=False)
    haemoglobin = db.Column(db.Float, nullable=False)
    cholesterol = db.Column(db.Float, nullable=False)
    remarks = db.Column(db.String(500))

    def __repr__(self):
        return f"<Patient {self.full_name}>"


# Validate patient input
def validate_patient_data(data):
    if not isinstance(data, dict):
        return "Invalid request. Please submit patient details."

    required_fields = [
        "full_name", "dob", "email",
        "glucose", "haemoglobin", "cholesterol"
    ]

    for field in required_fields:
        value = data.get(field)

        if value is None or (isinstance(value, str) and not value.strip()):
            return f"{field.replace('_', ' ').title()} is required."

    full_name = data["full_name"].strip()
    email = data["email"].strip()

    if len(full_name) > 100:
        return "Full name must be 100 characters or fewer."

    email_pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

    if len(email) > 100 or not re.fullmatch(email_pattern, email):
        return "Please enter a valid email address."

    dob_value = data["dob"]

    if not isinstance(dob_value, str):
        return "Date of birth must use YYYY-MM-DD format."

    try:
        dob = datetime.strptime(dob_value, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return "Please enter a valid date of birth in YYYY-MM-DD format."

    if dob.isoformat() != dob_value:
        return "Please enter a valid date of birth in YYYY-MM-DD format."

    if dob > datetime.today().date():
        return "Future date is not allowed for date of birth."

    for field in ["glucose", "haemoglobin", "cholesterol"]:
        if isinstance(data[field], bool):
            return f"{field.title()} must be a valid number."

        try:
            value = float(data[field])
        except (ValueError, TypeError):
            return f"{field.title()} must be a valid number."

        if not math.isfinite(value):
            return f"{field.title()} must be a finite number."

        if value < 0:
            return f"{field.title()} cannot be negative."

    return None


# Validate new account details
def validate_registration(data):
    if not isinstance(data, dict):
        return "Invalid request. Please submit account details."

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not all(isinstance(value, str) for value in [username, email, password]):
        return "Username, email, and password are required."

    username = username.strip()
    email = email.strip()

    if not username or not email or not password:
        return "Username, email, and password are required."

    if len(username) < 3 or len(username) > 50:
        return "Username must contain 3 to 50 characters."

    if not re.fullmatch(r"[A-Za-z0-9_.-]+", username):
        return "Username may contain letters, numbers, underscores, dots, and hyphens."

    if len(email) > 100 or not re.fullmatch(
        r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$",
        email
    ):
        return "Please enter a valid email address."

    if len(password) < 8:
        return "Password must be at least 8 characters long."

    if len(password) > 128:
        return "Password must be 128 characters or fewer."

    return None


# Rule-based health indicator summary
def predict_health_condition(glucose, haemoglobin, cholesterol):
    if glucose > 140 and cholesterol > 200:
        return "High risk of Diabetes and Heart Disease"
    elif glucose > 126:
        return "Possible Diabetes Risk"
    elif cholesterol > 200:
        return "High Cholesterol Risk"
    elif haemoglobin < 12:
        return "Possible Anemia Risk"
    return "Healthy Range"


# Convert patient model to JSON-compatible dictionary
def patient_to_dict(patient):
    return {
        "id": patient.id,
        "full_name": patient.full_name,
        "dob": patient.dob,
        "email": patient.email,
        "glucose": patient.glucose,
        "haemoglobin": patient.haemoglobin,
        "cholesterol": patient.cholesterol,
        "remarks": patient.remarks,
    }


# Home endpoint
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Health Prediction API is running"
    }), 200


# Register a new account
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    validation_error = validate_registration(data)

    if validation_error:
        return jsonify({"error": validation_error}), 400

    username = data["username"].strip()
    email = data["email"].strip().lower()

    try:
        existing_user = User.query.filter(
            db.or_(
                db.func.lower(User.username) == username.lower(),
                db.func.lower(User.email) == email
            )
        ).first()

        if existing_user:
            return jsonify({
                "error": "That username or email is already registered."
            }), 409

        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(data["password"])
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({
            "message": "Account registered successfully. You can now log in."
        }), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "error": "That username or email is already registered."
        }), 409

    except Exception:
        db.session.rollback()
        app.logger.exception("Registration failed")
        return jsonify({
            "error": "Unable to register account."
        }), 500


# Log in using a registered account
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Please submit your login details."}), 400

    username = data.get("username")
    password = data.get("password")

    if (
        not isinstance(username, str)
        or not isinstance(password, str)
        or not username.strip()
        or not password
    ):
        return jsonify({
            "error": "Username and password are required."
        }), 400

    user = User.query.filter(
        db.func.lower(User.username) == username.strip().lower()
    ).first()

    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify({
            "error": "Invalid username or password."
        }), 401

    # This endpoint verifies credentials only. It does not create a
    # login session or authorize access to patient data.
    return jsonify({
        "message": "Credentials verified successfully.",
        "username": user.username
    }), 200


# Create a patient
@app.route("/patients", methods=["POST"])
def create_patient():
    data = request.get_json(silent=True)
    validation_error = validate_patient_data(data)

    if validation_error:
        return jsonify({"error": validation_error}), 400

    try:
        glucose = float(data["glucose"])
        haemoglobin = float(data["haemoglobin"])
        cholesterol = float(data["cholesterol"])

        patient = Patient(
            full_name=data["full_name"].strip(),
            dob=data["dob"],
            email=data["email"].strip(),
            glucose=glucose,
            haemoglobin=haemoglobin,
            cholesterol=cholesterol,
            remarks=predict_health_condition(
                glucose, haemoglobin, cholesterol
            ),
        )

        db.session.add(patient)
        db.session.commit()

        return jsonify({
            "message": "Patient created successfully",
            "patient": patient_to_dict(patient),
        }), 201

    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to create patient")
        return jsonify({"error": "Unable to save patient record."}), 500


# Get all patients
@app.route("/patients", methods=["GET"])
def get_patients():
    patients = Patient.query.order_by(Patient.id.desc()).all()
    return jsonify([patient_to_dict(p) for p in patients]), 200


# Update a patient
@app.route("/patients/<int:id>", methods=["PUT"])
def update_patient(id):
    patient = db.session.get(Patient, id)

    if patient is None:
        return jsonify({"error": "Patient not found."}), 404

    data = request.get_json(silent=True)
    validation_error = validate_patient_data(data)

    if validation_error:
        return jsonify({"error": validation_error}), 400

    try:
        glucose = float(data["glucose"])
        haemoglobin = float(data["haemoglobin"])
        cholesterol = float(data["cholesterol"])

        patient.full_name = data["full_name"].strip()
        patient.dob = data["dob"]
        patient.email = data["email"].strip()
        patient.glucose = glucose
        patient.haemoglobin = haemoglobin
        patient.cholesterol = cholesterol
        patient.remarks = predict_health_condition(
            glucose, haemoglobin, cholesterol
        )

        db.session.commit()

        return jsonify({
            "message": "Patient updated successfully",
            "patient": patient_to_dict(patient),
        }), 200

    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to update patient")
        return jsonify({"error": "Unable to update patient record."}), 500


# Delete a patient
@app.route("/patients/<int:id>", methods=["DELETE"])
def delete_patient(id):
    patient = db.session.get(Patient, id)

    if patient is None:
        return jsonify({"error": "Patient not found."}), 404

    try:
        db.session.delete(patient)
        db.session.commit()
        return jsonify({"message": "Patient deleted successfully"}), 200

    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to delete patient")
        return jsonify({"error": "Unable to delete patient record."}), 500


# Create tables without deleting existing patient records
with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True)
