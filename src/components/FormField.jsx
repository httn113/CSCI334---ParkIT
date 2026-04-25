import './FormField.css';

export default function FormField({ label, error, htmlFor, children }) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-field-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error && <span className="form-field-error">{error}</span>}
    </div>
  );
}
