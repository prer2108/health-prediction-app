# Health Prediction App

A web-based health information management and prediction application built using React, Flask, and SQLite. The application provides user registration and login, patient record management, and basic rule-based health predictions based on recorded health measurements.

## Features

- **User Registration and Login** — Register an account and log in.
- **Patient Management** — Add, view, update, and delete patient records.
- **Health Measurements** — Store glucose, haemoglobin, and cholesterol values.
- **Rule-Based Predictions** — Generate simple predictions using configured rules.
- **Dashboard** — View patient information through a dashboard interface.
- **Database Storage** — Store application data using SQLite.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Bootstrap, CSS |
| Backend | Python, Flask |
| Database | SQLite |
| ORM | SQLAlchemy |
| Password Hashing | Werkzeug |

## Project Structure

```text
health-prediction-app/
├── backend/
│   ├── app.py
│   └── instance/
│       └── patients.db
└── frontend/
    ├── public/
    ├── src/
    │   ├── App.js
    │   ├── App.css
    │   ├── Dashboard.js
    │   ├── login.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## Getting Started

### Prerequisites

Install the following before running the application:

- Python 3
- Node.js and npm
- Git

### 1. Start the Backend

Open a terminal in the project directory:

```bash
cd backend
```

Install the required Python packages using your project's requirements file, if available:

```bash
pip install -r requirements.txt
```

Then start the Flask application using the command appropriate for your backend setup. If `app.py` is the entry point, try:

```bash
python app.py
```

### 2. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

The React application should open at:

http://localhost:3000

Make sure the Flask backend is running at the address configured in the frontend.

## Disclaimer

This application is intended for educational and demonstration purposes only. Its rule-based predictions are not medical diagnoses and should not be used to make medical decisions. Consult a qualified healthcare professional for medical advice.

## Author

Developed as a health prediction and patient management project.
