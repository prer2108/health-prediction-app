import { CSVLink } from "react-csv";
import { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    email: "",
    glucose: "",
    haemoglobin: "",
    cholesterol: "",
  });

  // Fetch patients from backend
  const fetchPatients = async () => {
    const res = await axios.get("http://127.0.0.1:5000/patients");
    setPatients(res.data);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      if (editingId) {
        await axios.put(
          `http://127.0.0.1:5000/patients/${editingId}`,
          formData
        );

        setEditingId(null);
       } else {
         await axios.post(
           "http://127.0.0.1:5000/patients",
           formData
         );
      }

    setFormData({
      full_name: "",
      dob: "",
      email: "",
      glucose: "",
      haemoglobin: "",
      cholesterol: "",
    });

    fetchPatients();

    setSuccess(
      editingId
        ? "Patient updated successfully!"
        : "Patient saved successfully!"
      );

  } catch (err) {
      setError(
        err.response?.data?.error || "Something went wrong. Please try again."
      );
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this patient?"
    );

    if (!confirmDelete) return;

    await axios.delete(`http://127.0.0.1:5000/patients/${id}`);
    fetchPatients();
  };

  const handleEdit = (patient) => {
  setFormData({
    full_name: patient.full_name,
    dob: patient.dob,
    email: patient.email,
    glucose: patient.glucose,
    haemoglobin: patient.haemoglobin,
    cholesterol: patient.cholesterol,
  });

  setEditingId(patient.id);
};

  return (
    <div
      className="text-center text-white p-4 mb-4"
      style={{
        background: "linear-gradient(90deg, #0d6efd, #20c997)",
        borderRadius: "15px"
     }}
    >
     <h1>🏥 Health Prediction App</h1>
     <p className="mb-0">
      Patient Management & Health Risk Analysis
     </p>
    

      <div
        className="card p-4 shadow-lg border-0"
        style={{ borderRadius: "15px" }}
      >

        {error && (
          <div className="alert alert-danger mt-3" role="alert">
           ⚠️ {error}
          </div>
       )}

        {success && (
          <div className="alert alert-success">
           {success}
          </div>
       )}

       <form onSubmit={handleSubmit}>

    <div className="mb-3">
      <input
        className="form-control"
        name="full_name"
        placeholder="Full Name"
        value={formData.full_name}
        onChange={handleChange}
      />
    </div>

    <div className="mb-3">
      <input
        className="form-control"
        type="date"
        name="dob"
        value={formData.dob}
        onChange={handleChange}
      />
    </div>

    <div className="mb-3">
      <input
        className="form-control"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
      />
    </div>

    <div className="mb-3">
      <input
        className="form-control"
        name="glucose"
        placeholder="Glucose"
        value={formData.glucose}
        onChange={handleChange}
      />
    </div>

    <div className="mb-3">
      <input
        className="form-control"
        name="haemoglobin"
        placeholder="Haemoglobin"
        value={formData.haemoglobin}
        onChange={handleChange}
      />
    </div>

    <div className="mb-3">
      <input
        className="form-control"
        name="cholesterol"
        placeholder="Cholesterol"
        value={formData.cholesterol}
        onChange={handleChange}
      />
    </div>

    <button
      className="btn btn-primary px-4"
      type="submit"
    >
      {editingId ? "Update Patient" : "Save Patient"}
    </button>

  </form>
</div>

      <hr />

      {/* TABLE */}
      <h2
        className="mt-4 mb-3"
        style={{ color: "#198754" }}
      >
       📋 Patients List
      </h2>

      <input
        className="form-control mb-3"
        placeholder="Search Patient"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button
        className="btn btn-secondary mb-3"
        onClick={() => setSortAsc(!sortAsc)}
      >
        Sort By Name
      </button>
      
      <CSVLink
        data={patients}
        filename="patients.csv"
        className="btn btn-success mb-3"
      >
        Export CSV
      </CSVLink>
      
      <h5 className="text-secondary">
        Total Patients: {patients.length}
      </h5>

      <div
        className="container-fluid mt-5"
        style={{
          backgroundColor: "#f8f9fa",
          padding: "30px",
          borderRadius: "15px"
       }}
      >
        <table className="table table-bordered table-striped table-hover">
      
          <thead>
          <tr>
            <th>Name</th>
            <th>DOB</th>
            <th>Email</th>
            <th>Glucose</th>
            <th>Hb</th>
            <th>Cholesterol</th>
            <th>Remarks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients
            .filter((p) =>
               p.full_name.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) =>
              sortAsc
                ? a.full_name.localeCompare(b.full_name)
                : b.full_name.localeCompare(a.full_name)
           )
            .map((p) => (
              <tr key={p.id}>
                <td>{p.full_name}</td>
                <td>{p.dob}</td>
                <td>{p.email}</td>
                <td>{p.glucose}</td>
                <td>{p.haemoglobin}</td>
                <td>{p.cholesterol}</td>
                <td>
                  <span
                    className={
                      p.remarks === "Healthy Range"
                        ? "badge bg-success"
                        : "badge bg-danger"
                    }
                  >
                      {p.remarks}
                  </span>
                </td>

              <td>
                <button
                  type="button"
                  onClick={() => handleEdit(p)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

export default Dashboard;
