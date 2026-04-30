import { useState, useEffect } from 'react';
import './MyProfile.css';
import SectionTitle from '../components/SectionTitle';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import FormField from '../components/FormField';

// DEMO ONLY -- replace with data fetched from backend
const USER_DATA = {
  firstName: 'John',
  lastName: 'Doe',
  username: 'user',
};

const ENDPOINT = import.meta.env.VITE_API_URL;

const INITIAL_PLATES = [
  { id: 1, plate: 'TEST-1234', model: 'Toyota' },
];

const CAR_BRANDS = [
  'BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Honda', 'Hyundai',
  'Kia', 'Ford', 'Chevrolet', 'Volkswagen', 'Mazda', 'Nissan',
  'Subaru', 'Volvo', 'Lexus', 'Tesla', 'Other',
];

const CAR_TYPES = ['Sedan', 'SUV', 'Minivan', 'Hatchback', 'Coupe', 'Pickup Truck', 'Convertible', 'Wagon', 'Other'];

// Change these at the top
const EMPTY_FORM = { licensePlate: '', color: '', brand: '', model: '', type: '' };
const EMPTY_ERRORS = { licensePlate: '', color: '', brand: '', model: '', type: '' };

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [plates, setPlates] = useState([]);
  const [showAddPlate, setShowAddPlate] = useState(false);
  const [plateForm, setPlateForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState(EMPTY_ERRORS);

  function openAddPlate() {
    setPlateForm(EMPTY_FORM);
    setFormErrors(EMPTY_ERRORS);
    setShowAddPlate(true);
  }

  function closeAddPlate() {
    setShowAddPlate(false);
    setFormErrors(EMPTY_ERRORS);
  }

  function handlePlateFormChange(e) {
    const { name, value } = e.target;
    setPlateForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validateForm() {
    const labels = {
      licensePlate: 'License Plate Number',
      color:     'Car Color',
      brand:     'Car Brand',
      model:     'Car Model',
      type:      'Car Type',
    };
    const errors = { ...EMPTY_ERRORS };
    let valid = true;
    Object.keys(labels).forEach((key) => {
      const val = plateForm[key].trim();
      if (!val) {
        errors[key] = `${labels[key]} is required.`;
        valid = false;
      } else if (val.length < 3) {
        errors[key] = `${labels[key]} must be at least 3 characters.`;
        valid = false;
      }
    });
    setFormErrors(errors);
    return valid;
  }

  // ── TODO (backend dev): wire up this handler ──────────────────────────────
  // When the user clicks "Done", send a POST request to add the new plate.
  // plateForm contains: { licenseNo, color, brand, model, type }
  // Example endpoint: POST /api/plates  body: plateForm
  // On success: refresh the plates list and close the modal.
  // ─────────────────────────────────────────────────────────────────────────
  async function handleAddPlateDone() {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem("access_token");
      console.log(token)
      console.log(plateForm)

      const res = await fetch(`${ENDPOINT}/protected/myProfile/addLicensePlate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(plateForm)
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Failed to add plate:", err);
        return;
      }

      // Refresh the plates list
      const updated = await fetch(`${ENDPOINT}/protected/myProfile/showLicensePlate`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const updatedData = await updated.json();
      setPlates(updatedData);

      closeAddPlate();

    } catch (err) {
      console.error("Error adding plate:", err);
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        console.log(token)
        console.log(ENDPOINT);


        const profile_res = await fetch(`${ENDPOINT}/protected/myProfile/information`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const data = await profile_res.json();
        setUser(data);

      } catch (err) {
        console.error("Error fetching profile:", err);
      }

      try {
        const token = localStorage.getItem("access_token");
        console.log(token)

        const plate_res = await fetch(`${ENDPOINT}/protected/myProfile/showLicensePlate`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const plate_data = await plate_res.json();
        setPlates(plate_data);
        console.log(plates);
        console.log(plate_data);

      } catch (err) {
        console.error("Error fetching profile:", err);
      }

    };

    fetchProfile();
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="profile-page">

      {/* ── Personal Info ── */}
      <SectionTitle>Personal Information</SectionTitle>
      <GlassCard className="profile-card">

        {/* First Name + Last Name on same row */}
        <div className="profile-row">
          <div className="profile-field">
            <label className="profile-label" htmlFor="profile-firstname">First Name</label>
            <input
              id="profile-firstname"
              type="text"
              className="profile-input"
              value={user.customerFName} 
              readOnly
            />
          </div>
          <div className="profile-field">
            <label className="profile-label" htmlFor="profile-lastname">Last Name</label>
            <input
              id="profile-lastname"
              type="text"
              className="profile-input"
              value={user.customerLName}
              readOnly
            />
          </div>
        </div>

        {/* Username */}
        <div className="profile-field">
          <label className="profile-label" htmlFor="profile-username">Username</label>
          <input
            id="profile-username"
            type="text"
            className="profile-input"
            value={user.email}
            readOnly
          />
        </div>


        {/* Phone */}
        <div className="profile-field">
          <label className="profile-label">Phone</label>
          <input
            id="profile-phone"
            type="text"
            className="profile-input"
            value={user.phone}
            readOnly
          />
        </div>

        {/* License Number */}
        <div className="profile-field">
          <label className="profile-label">License Number</label>
          <input
            id="profile-licenseNo"
            type="text"
            className="profile-input"
            value={user.licenseNo}
            readOnly
          />
        </div>

        {/* Password -- actual value should come from backend, never stored in client */}
        <div className="profile-field">
          <label className="profile-label" htmlFor="profile-password">Password</label>
          <div className="profile-input-wrap">
            <input
              id="profile-password"
              type="password"
              className="profile-input has-icon"
              defaultValue="••••••••"
              readOnly
            />
          </div>
        </div>

      </GlassCard>

      {/* ── License Plates ── */}
      <SectionTitle style={{ marginTop: 32 }}>Registered License Plates</SectionTitle>
      <GlassCard className="profile-card">

        <div className="plate-list">
          {plates.length === 0 ? (
            <p>No license plates found</p>
          ) : (
            plates.map((item) => (
              <div key={item.licensePlate} className="plate-card">
                <div className="plate-info">
                  <div className="plate-badge">{item.licensePlate}</div>
                  <div className="plate-meta">
                    <span className="plate-model">{item.model}</span>
                    <span className="plate-tag">Car Model</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="plate-edit-btn"
                  onClick={() => console.log("Edit", item.id)}
                >
                  Edit
                </button>
              </div>
            ))
          )}
        </div>

        <button
          id="profile-add-plate"
          type="button"
          className="add-plate-btn"
          onClick={openAddPlate}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add License Plate
        </button>

      </GlassCard>

      {/* ── Add License Plate Modal ── */}
      {/* ── Add License Plate Modal ── */}
      <Modal title="Add License Plate" open={showAddPlate} onClose={closeAddPlate}>

        <FormField label="License Plate Number" error={formErrors.licensePlate} htmlFor="ap-licensePlate">
          <input
            id="ap-licensePlate"
            name="licensePlate"
            type="text"
            className={`modal-input${formErrors.licensePlate ? ' modal-input-error' : ''}`}
            placeholder="e.g. ABC-1234"
            value={plateForm.licensePlate}
            onChange={handlePlateFormChange}
          />
        </FormField>

        <FormField label="Car Color" error={formErrors.color} htmlFor="ap-color">
          <input
            id="ap-color"
            name="color"
            type="text"
            className={`modal-input${formErrors.color ? ' modal-input-error' : ''}`}
            placeholder="e.g. Pearl White"
            value={plateForm.color}
            onChange={handlePlateFormChange}
          />
        </FormField>

        <FormField label="Car Brand" error={formErrors.brand} htmlFor="ap-brand">
          <select
            id="ap-brand"
            name="brand"
            className={`modal-input modal-select${formErrors.brand ? ' modal-input-error' : ''}`}
            value={plateForm.brand}
            onChange={handlePlateFormChange}
          >
            <option value="" disabled>Select brand</option>
            {CAR_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </FormField>

        <FormField label="Car Model" error={formErrors.model} htmlFor="ap-model">
          <input
            id="ap-model"
            name="model"
            type="text"
            className={`modal-input${formErrors.model ? ' modal-input-error' : ''}`}
            placeholder="e.g. Camry, 3 Series, C-Class"
            value={plateForm.model}
            onChange={handlePlateFormChange}
          />
        </FormField>

        <FormField label="Car Type" error={formErrors.type} htmlFor="ap-type">
          <select
            id="ap-type"
            name="type"
            className={`modal-input modal-select${formErrors.type ? ' modal-input-error' : ''}`}
            value={plateForm.type}
            onChange={handlePlateFormChange}
          >
            <option value="" disabled>Select type</option>
            {CAR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>

        <button
          type="button"
          className="modal-done-btn"
          onClick={handleAddPlateDone}
        >
          Done
        </button>

      </Modal>

    </div>
  );
}
