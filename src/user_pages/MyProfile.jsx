import { useState } from 'react';
import './MyProfile.css';

// DEMO ONLY -- replace with data fetched from backend
const USER_DATA = {
  firstName: 'John',
  lastName: 'Doe',
  username: 'user',
};

const INITIAL_PLATES = [
  { id: 1, plate: 'TEST-1234', model: 'Toyota' },
];

const CAR_BRANDS = [
  'BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Honda', 'Hyundai',
  'Kia', 'Ford', 'Chevrolet', 'Volkswagen', 'Mazda', 'Nissan',
  'Subaru', 'Volvo', 'Lexus', 'Tesla', 'Other',
];

const CAR_TYPES = ['Sedan', 'SUV', 'Minivan', 'Hatchback', 'Coupe', 'Pickup Truck', 'Convertible', 'Wagon', 'Other'];

const EMPTY_FORM = { licenseNo: '', color: '', brand: '', model: '', type: '' };
const EMPTY_ERRORS = { licenseNo: '', color: '', brand: '', model: '', type: '' };

export default function MyProfile() {
  const [plates] = useState(INITIAL_PLATES);
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
      licenseNo: 'License Plate Number',
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
  function handleAddPlateDone() {
    if (!validateForm()) return;

    // ── TODO (backend dev): wire up this handler ────────────────────────────
    // All fields are validated: { licenseNo, color, brand, model, type }
    // Example endpoint: POST /api/plates  body: JSON.stringify(plateForm)
    // On success: refresh the plates list and call closeAddPlate().
    // ─────────────────────────────────────────────────────────────────────────
  }

  return (
    <div className="profile-page">

      {/* ── Personal Info ── */}
      <p className="profile-section-title">Personal Information</p>
      <div className="profile-card">

        {/* First Name + Last Name on same row */}
        <div className="profile-row">
          <div className="profile-field">
            <label className="profile-label" htmlFor="profile-firstname">First Name</label>
            <input
              id="profile-firstname"
              type="text"
              className="profile-input"
              defaultValue={USER_DATA.firstName}
              readOnly
            />
          </div>
          <div className="profile-field">
            <label className="profile-label" htmlFor="profile-lastname">Last Name</label>
            <input
              id="profile-lastname"
              type="text"
              className="profile-input"
              defaultValue={USER_DATA.lastName}
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
            defaultValue={USER_DATA.username}
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

      </div>

      {/* ── License Plates ── */}
      <p className="profile-section-title">Registered License Plates</p>
      <div className="profile-card">

        <div className="plate-list">
          {plates.map((item) => (
            <div key={item.id} className="plate-card">
              <div className="plate-info">
                <div className="plate-badge">{item.plate}</div>
                <div className="plate-meta">
                  <span className="plate-model">{item.model}</span>
                  <span className="plate-tag">Car Model</span>
                </div>
              </div>

              {/* Edit button – no action yet */}
              <button
                id={`plate-edit-${item.id}`}
                type="button"
                className="plate-edit-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            </div>
          ))}
        </div>

        {/* Add License Plate */}
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

      </div>

      {/* ── Add License Plate Modal ── */}
      {showAddPlate && (
        <div className="modal-overlay" onClick={closeAddPlate}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>

            {/* Close button */}
            <button type="button" className="modal-close-btn" onClick={closeAddPlate} aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="modal-title">Add License Plate</h2>

            {/* License No */}
            <div className="modal-field">
              <label className="modal-label" htmlFor="ap-licenseNo">License Plate Number</label>
              <input
                id="ap-licenseNo"
                name="licenseNo"
                type="text"
                className={`modal-input${formErrors.licenseNo ? ' modal-input-error' : ''}`}
                placeholder="e.g. ABC-1234"
                value={plateForm.licenseNo}
                onChange={handlePlateFormChange}
              />
              {formErrors.licenseNo && <span className="modal-error">{formErrors.licenseNo}</span>}
            </div>

            {/* Car Color */}
            <div className="modal-field">
              <label className="modal-label" htmlFor="ap-color">Car Color</label>
              <input
                id="ap-color"
                name="color"
                type="text"
                className={`modal-input${formErrors.color ? ' modal-input-error' : ''}`}
                placeholder="e.g. Pearl White"
                value={plateForm.color}
                onChange={handlePlateFormChange}
              />
              {formErrors.color && <span className="modal-error">{formErrors.color}</span>}
            </div>

            {/* Car Brand */}
            <div className="modal-field">
              <label className="modal-label" htmlFor="ap-brand">Car Brand</label>
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
              {formErrors.brand && <span className="modal-error">{formErrors.brand}</span>}
            </div>

            {/* Car Model */}
            <div className="modal-field">
              <label className="modal-label" htmlFor="ap-model">Car Model</label>
              <input
                id="ap-model"
                name="model"
                type="text"
                className={`modal-input${formErrors.model ? ' modal-input-error' : ''}`}
                placeholder="e.g. Camry, 3 Series, C-Class"
                value={plateForm.model}
                onChange={handlePlateFormChange}
              />
              {formErrors.model && <span className="modal-error">{formErrors.model}</span>}
            </div>

            {/* Car Type */}
            <div className="modal-field">
              <label className="modal-label" htmlFor="ap-type">Car Type</label>
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
              {formErrors.type && <span className="modal-error">{formErrors.type}</span>}
            </div>

            {/* Done – backend dev: connect handleAddPlateDone() to your API */}
            <button
              type="button"
              className="modal-done-btn"
              onClick={handleAddPlateDone}
            >
              Done
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
