
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CSVLink } from "react-csv";
import "./App.css";

const API_URL = "http://127.0.0.1:5000";

function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("full_name");
  const [activeView, setActiveView] = useState("Dashboard");
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    full_name: "",
    dob: "",
    email: "",
    glucose: "",
    haemoglobin: "",
    cholesterol: "",
  };

  const [form, setForm] = useState(emptyForm);

  const loadPatients = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API_URL}/patients`);
      setPatients(response.data);
    } catch (err) {
      setError(
        "Could not connect to the backend. Make sure your Flask server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const stats = useMemo(() => {
    const diabetes = patients.filter((p) =>
      (p.remarks || "").toLowerCase().includes("diabetes")
    ).length;

    const review = patients.filter((p) => {
      const remark = (p.remarks || "").toLowerCase();
      return (
        remark.includes("risk") ||
        remark.includes("anemia") ||
        remark.includes("cholesterol")
      );
    }).length;

    return {
      total: patients.length,
      review,
      diabetes,
      normal: Math.max(0, patients.length - review - diabetes),
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...patients]
      .filter((patient) =>
        [
          patient.full_name,
          patient.email,
          patient.remarks,
        ].some((value) => (value || "").toLowerCase().includes(query))
      )
      .sort((a, b) => {
        const first = a[sortBy] ?? "";
        const second = b[sortBy] ?? "";

        if (typeof first === "number" && typeof second === "number") {
          return first - second;
        }

        return String(first).localeCompare(String(second));
      });
  }, [patients, search, sortBy]);

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const savePatient = async (event) => {
    event.preventDefault();
    setError("");

    const numericFields = ["glucose", "haemoglobin", "cholesterol"];

    for (const field of numericFields) {
      if (form[field] === "" || !Number.isFinite(Number(form[field]))) {
        setError(`Please enter a valid number for ${field}.`);
        return;
      }

      if (Number(form[field]) < 0) {
        setError(`${field} cannot be negative.`);
        return;
      }
    }

    try {
      const payload = {
        ...form,
        glucose: Number(form.glucose),
        haemoglobin: Number(form.haemoglobin),
        cholesterol: Number(form.cholesterol),
      };

      if (editingId) {
        await axios.put(`${API_URL}/patients/${editingId}`, payload);
      } else {
        await axios.post(`${API_URL}/patients`, payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      setActiveView("Patients");
      await loadPatients();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to save the patient. Check the entered details and backend."
      );
    }
  };

  const editPatient = (patient) => {
    setForm({
      full_name: patient.full_name || "",
      dob: patient.dob || "",
      email: patient.email || "",
      glucose: String(patient.glucose ?? ""),
      haemoglobin: String(patient.haemoglobin ?? ""),
      cholesterol: String(patient.cholesterol ?? ""),
    });

    setEditingId(patient.id);
    setActiveView("Patients");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient record?")) {
      return;
    }

    setError("");

    try {
      await axios.delete(`${API_URL}/patients/${id}`);
      await loadPatients();
    } catch (err) {
      setError("Unable to delete this record. Please try again.");
    }
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  const csvHeaders = [
    { label: "Patient ID", key: "id" },
    { label: "Full Name", key: "full_name" },
    { label: "Date of Birth", key: "dob" },
    { label: "Email", key: "email" },
    { label: "Glucose", key: "glucose" },
    { label: "Haemoglobin", key: "haemoglobin" },
    { label: "Cholesterol", key: "cholesterol" },
    { label: "Recorded Remark", key: "remarks" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">H+</div>
          <div>
            <h2>HealthTrack</h2>
            <p>Patient management</p>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        {["Dashboard", "Patients", "Health analytics"].map((item) => (
          <button
            type="button"
            key={item}
            className={`nav-item ${activeView === item ? "active" : ""}`}
            onClick={() => setActiveView(item)}
          >
            <span>{item === "Dashboard" ? "▦" : item === "Patients" ? "♙" : "▥"}</span>
            {item}
          </button>
        ))}

        <div className="sidebar-footer">
          <div className="status-dot" />
          <span>Patient records workspace</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">HEALTH PREDICTION SYSTEM</p>
            <h1>{activeView}</h1>
            <p className="page-subtitle">
              Manage patient records and review recorded health indicators.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              cancelEdit();
              setActiveView("Patients");
            }}
          >
            + Add patient
          </button>
        </header>

        {error && <div className="alert-error" role="alert">{error}</div>}

        {activeView === "Dashboard" && (
          <>
            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-icon purple">♙</div>
                <p>Total patients</p>
                <h2>{stats.total}</h2>
                <span>Records in the system</span>
              </article>

              <article className="stat-card">
                <div className="stat-icon blue">⌕</div>
                <p>Flagged for review</p>
                <h2>{stats.review}</h2>
                <span>Based on saved remarks</span>
              </article>

              <article className="stat-card">
                <div className="stat-icon orange">＋</div>
                <p>Diabetes-related flags</p>
                <h2>{stats.diabetes}</h2>
                <span>Based on saved remarks</span>
              </article>

              <article className="stat-card">
                <div className="stat-icon green">✓</div>
                <p>Other records</p>
                <h2>{stats.normal}</h2>
                <span>Not counted in the above groups</span>
              </article>
            </section>

            <section className="content-card">
              <div className="section-heading">
                <div>
                  <h2>Recent patient records</h2>
                  <p>Latest records added to your workspace.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setActiveView("Patients")}
                  type="button"
                >
                  View all →
                </button>
              </div>

              {loading ? (
                <p className="empty-state">Loading patient records...</p>
              ) : patients.length === 0 ? (
                <p className="empty-state">
                  No records yet. Select “Add patient” to create your first record.
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Glucose</th>
                        <th>Haemoglobin</th>
                        <th>Cholesterol</th>
                        <th>Recorded remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...patients].slice(-5).reverse().map((patient) => (
                        <tr key={patient.id}>
                          <td>
                            <strong>{patient.full_name}</strong>
                            <small>{patient.email}</small>
                          </td>
                          <td>{patient.glucose}</td>
                          <td>{patient.haemoglobin}</td>
                          <td>{patient.cholesterol}</td>
                          <td>
                            <span className="remark">{patient.remarks || "Not available"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {activeView === "Patients" && (
          <>
            <section className="content-card form-card">
              <div className="section-heading">
                <div>
                  <h2>{editingId ? "Edit patient" : "Patient information"}</h2>
                  <p>Enter the patient's details and recorded health measurements.</p>
                </div>
                {editingId && <span className="edit-label">Editing record #{editingId}</span>}
              </div>

              <form onSubmit={savePatient}>
                <div className="form-grid">
                  <label>
                    Full name
                    <input
                      name="full_name"
                      value={form.full_name}
                      onChange={updateField}
                      required
                      maxLength="120"
                      placeholder="Enter full name"
                    />
                  </label>

                  <label>
                    Date of birth
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={updateField}
                      required
                    />
                  </label>

                  <label>
                    Email address
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={updateField}
                      required
                      maxLength="254"
                      placeholder="patient@example.com"
                    />
                  </label>

                  <label>
                    Glucose
                    <input
                      type="number"
                      name="glucose"
                      value={form.glucose}
                      onChange={updateField}
                      required
                      min="0"
                      step="any"
                      placeholder="e.g. 100"
                    />
                  </label>

                  <label>
                    Haemoglobin
                    <input
                      type="number"
                      name="haemoglobin"
                      value={form.haemoglobin}
                      onChange={updateField}
                      required
                      min="0"
                      step="any"
                      placeholder="e.g. 13.5"
                    />
                  </label>

                  <label>
                    Cholesterol
                    <input
                      type="number"
                      name="cholesterol"
                      value={form.cholesterol}
                      onChange={updateField}
                      required
                      min="0"
                      step="any"
                      placeholder="e.g. 180"
                    />
                  </label>
                </div>

                <div className="form-actions">
                  {editingId && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  )}
                  <button className="primary-button" type="submit">
                    {editingId ? "Save changes" : "Save patient"}
                  </button>
                </div>
              </form>
            </section>

            <section className="content-card">
              <div className="section-heading">
                <div>
                  <h2>Patient directory</h2>
                  <p>Search, sort, edit, and export saved records.</p>
                </div>
                <CSVLink
                  data={filteredPatients}
                  headers={csvHeaders}
                  filename="healthtrack-patients.csv"
                  className="secondary-button csv-link"
                >
                  Export CSV
                </CSVLink>
              </div>

              <div className="table-controls">
                <input
                  aria-label="Search patients"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, or remark..."
                />

                <select
                  aria-label="Sort patients"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="full_name">Sort by name</option>
                  <option value="glucose">Sort by glucose</option>
                  <option value="haemoglobin">Sort by haemoglobin</option>
                  <option value="cholesterol">Sort by cholesterol</option>
                </select>
              </div>

              {loading ? (
                <p className="empty-state">Loading patient records...</p>
              ) : filteredPatients.length === 0 ? (
                <p className="empty-state">No matching patient records found.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Date of birth</th>
                        <th>Glucose</th>
                        <th>Haemoglobin</th>
                        <th>Cholesterol</th>
                        <th>Recorded remark</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient) => (
                        <tr key={patient.id}>
                          <td>
                            <strong>{patient.full_name}</strong>
                            <small>{patient.email}</small>
                          </td>
                          <td>{patient.dob}</td>
                          <td>{patient.glucose}</td>
                          <td>{patient.haemoglobin}</td>
                          <td>{patient.cholesterol}</td>
                          <td><span className="remark">{patient.remarks || "Not available"}</span></td>
                          <td>
                            <div className="action-buttons">
                              <button type="button" className="edit-button" onClick={() => editPatient(patient)}>
                                Edit
                              </button>
                              <button type="button" className="delete-button" onClick={() => deletePatient(patient.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {activeView === "Health analytics" && (
          <section className="content-card">
            <div className="section-heading">
              <div>
                <h2>Recorded health indicators</h2>
                <p>A basic summary of remarks stored with patient records.</p>
              </div>
            </div>

            <div className="analytics-grid">
              {[
                {
                  label: "Diabetes-related remarks",
                  count: patients.filter((p) =>
                    (p.remarks || "").toLowerCase().includes("diabetes")
                  ).length,
                },
                {
                  label: "Cholesterol-related remarks",
                  count: patients.filter((p) =>
                    (p.remarks || "").toLowerCase().includes("cholesterol")
                  ).length,
                },
                {
                  label: "Anaemia-related remarks",
                  count: patients.filter((p) =>
                    (p.remarks || "").toLowerCase().includes("anemia") ||
                    (p.remarks || "").toLowerCase().includes("anaemia")
                  ).length,
                },
                {
                  label: "Healthy-range remarks",
                  count: patients.filter((p) =>
                    (p.remarks || "").toLowerCase().includes("healthy")
                  ).length,
                },
              ].map((item) => (
                <article className="analytics-item" key={item.label}>
                  <div className="analytics-label">
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${patients.length ? (item.count / patients.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>

            <p className="disclaimer">
              These summaries reflect saved rule-based remarks only. They are not
              medical diagnoses and should not replace evaluation by a qualified
              healthcare professional.
            </p>
          </section>
        )}

        <footer className="page-footer">
          HealthTrack · Patient records and rule-based indicator summaries
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
