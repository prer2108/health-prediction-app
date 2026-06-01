from flask import Flask, request, jsonify
from flask_cors import CORS
import re
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)

# SQLite Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///patients.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Patient Model
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
    
def validate_patient_data(data):

    # Email Validation
    email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'

    if not re.match(email_pattern, data['email']):
        return "Please enter a valid email address."

    # DOB Validation
    dob = datetime.strptime(data['dob'], "%Y-%m-%d").date()

    if dob > datetime.today().date():
        return "Future date is not allowed. Please enter a valid Date of Birth."

    # Numeric Validation
    try:
        float(data['glucose'])
        float(data['haemoglobin'])
        float(data['cholesterol'])
    except:
        return "Blood test values must be numeric"

    return None

def predict_health_condition(glucose, haemoglobin, cholesterol):

    if glucose > 140 and cholesterol > 200:
        return "High risk of Diabetes and Heart Disease"

    elif glucose > 126:
        return "Possible Diabetes Risk"

    elif cholesterol > 200:
        return "High Cholesterol Risk"

    elif haemoglobin < 12:
        return "Possible Anemia Risk"

    else:
        return "Healthy Range"

@app.route('/')
def home():
    return "Database Connected Successfully"

@app.route('/patients', methods=['POST'])
def create_patient():

    data = request.get_json()

    validation_error = validate_patient_data(data)

    if validation_error:
        return jsonify({
            "error": validation_error
        }), 400
    
    remarks = predict_health_condition(
        float(data['glucose']),
        float(data['haemoglobin']),
        float(data['cholesterol'])
    )

    patient = Patient(
        full_name=data['full_name'],
        dob=data['dob'],
        email=data['email'],
        glucose=float(data['glucose']),
        haemoglobin=float(data['haemoglobin']),
        cholesterol=float(data['cholesterol']),
        remarks=remarks
    )

    db.session.add(patient)
    db.session.commit()

    return jsonify({
        "message": "Patient created successfully"
    }), 201

@app.route('/patients', methods=['GET'])
def get_patients():

    patients = Patient.query.all()

    result = []

    for patient in patients:
        result.append({
            "id": patient.id,
            "full_name": patient.full_name,
            "dob": patient.dob,
            "email": patient.email,
            "glucose": patient.glucose,
            "haemoglobin": patient.haemoglobin,
            "cholesterol": patient.cholesterol,
            "remarks": patient.remarks
        })

    return jsonify(result)

@app.route('/patients/<int:id>', methods=['PUT'])
def update_patient(id):

    patient = Patient.query.get_or_404(id)

    data = request.get_json()

    patient.full_name = data['full_name']
    patient.dob = data['dob']
    patient.email = data['email']
    patient.glucose = float(data['glucose'])
    patient.haemoglobin = float(data['haemoglobin'])
    patient.cholesterol = float(data['cholesterol'])
    patient.remarks = predict_health_condition(
             float(data['glucose']),
             float(data['haemoglobin']),
             float(data['cholesterol'])
   )

    db.session.commit()

    return jsonify({
        "message": "Patient updated successfully"
    })

@app.route('/patients/<int:id>', methods=['DELETE'])
def delete_patient(id):

    patient = Patient.query.get_or_404(id)

    db.session.delete(patient)
    db.session.commit()

    return jsonify({
        "message": "Patient deleted successfully"
    })


# Create Database Tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)

