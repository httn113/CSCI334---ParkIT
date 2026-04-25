import { useState } from 'react';
import './FaqItem.css';

function ChevronIcon({ open }) {
  return (
    <svg
      className={`faq-chevron${open ? ' open' : ''}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen((v) => !v)}>
        <span>{question}</span>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="faq-answer">{answer}</div>}
    </div>
  );
}
