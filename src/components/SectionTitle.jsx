import './SectionTitle.css';

export default function SectionTitle({ children, style }) {
  return (
    <p className="section-title" style={style}>
      {children}
    </p>
  );
}
