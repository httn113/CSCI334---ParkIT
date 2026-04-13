import { useState } from 'react';
import './Support.css';

const CATEGORIES = [
  { id: 'account',      label: 'Account',      icon: AccountIcon },
  { id: 'booking',      label: 'Booking',       icon: BookingIcon },
  { id: 'vehicle',      label: 'Vehicle',       icon: VehicleIcon },
  { id: 'transactions', label: 'Transactions',  icon: TransactionIcon },
  { id: 'contact',      label: 'Contact Us',    icon: ContactIcon },
];

const FAQS = {
  account: [
    {
      q: 'How do I reset my password?',
      a: 'Go to My Profile → tap the password field → use the "Forgot Password" link on the login screen to receive a reset email.',
    },
    {
      q: 'How do I update my personal information?',
      a: 'Navigate to My Profile page. Your details are displayed there. Contact support if you need to change your registered email address.',
    },
    {
      q: 'Can I have multiple accounts?',
      a: 'Each email address can only be associated with one ParkIt account. Multiple accounts are not permitted under our Terms of Service.',
    },
    {
      q: 'How do I delete my account?',
      a: 'To permanently delete your account, please contact us via the Contact Us tab. Our team will process the request within 5 business days.',
    },
  ],
  booking: [
    {
      q: 'How do I book a parking spot?',
      a: 'Tap "Find Parking" from the home screen, choose an available spot on the map, select your time slot, and confirm the booking.',
    },
    {
      q: 'Can I cancel or modify a booking?',
      a: 'Yes. Open My Bookings, select the active booking and tap "Cancel". Cancellations made more than 30 minutes before start time receive a full refund.',
    },
    {
      q: 'What happens if I arrive late?',
      a: 'Your spot is held for up to 15 minutes past your booking start time. After that it may be released to other users.',
    },
    {
      q: 'How far in advance can I book?',
      a: 'You can book up to 7 days in advance. Same-day bookings are available subject to spot availability.',
    },
    {
      q: 'Will I receive a confirmation?',
      a: 'Yes, a booking confirmation is sent to your registered email and visible in the My Bookings tab immediately after checkout.',
    },
  ],
  vehicle: [
    {
      q: 'How do I add a vehicle / license plate?',
      a: 'Go to My Profile → Registered License Plates → tap "Add License Plate" and enter your plate number and vehicle model.',
    },
    {
      q: 'How many vehicles can I register?',
      a: 'You can register up to 3 vehicles on a single ParkIt account.',
    },
    {
      q: 'Can I edit or remove a registered plate?',
      a: 'Tap the Edit button next to any plate in My Profile. To remove a plate, open the edit view and select "Remove Vehicle".',
    },
    {
      q: 'What if my plate is not recognised at the gate?',
      a: 'Ensure the plate in your profile matches exactly. If the issue persists, use the intercom at the gate or contact support immediately.',
    },
  ],
  transactions: [
    {
      q: 'Where can I view my payment history?',
      a: 'A full transaction history is available under My Bookings → History tab. Each entry shows date, duration, spot, and amount charged.',
    },
    {
      q: 'What payment methods are accepted?',
      a: 'ParkIt accepts major credit/debit cards (Visa, Mastercard) and digital wallets (Apple Pay, Google Pay).',
    },
    {
      q: 'Why was I charged after cancelling?',
      a: 'Late cancellations (within 30 minutes of start time) incur a 50% fee. If you believe this is an error, please contact our support team.',
    },
    {
      q: 'How long does a refund take?',
      a: 'Refunds are processed within 3–5 business days and will appear on your original payment method.',
    },
    {
      q: 'Can I get a receipt / invoice?',
      a: 'Yes, receipts are automatically emailed after each transaction. You can also download them from the transaction history page.',
    },
  ],
  contact: [],
};

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function BookingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function VehicleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2"/>
      <path d="M16 8h4l3 5v3h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

function TransactionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`faq-chevron${open ? ' open' : ''}`}
      width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function FaqItem({ question, answer }) {
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

const CONTACT_TOPICS = ['General Inquiry', 'Account Issue', 'Booking Problem', 'Payment / Refund', 'Technical Bug', 'Other'];

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required.';
    if (!form.email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email.';
    if (!form.topic) newErrors.topic = 'Please select a topic.';
    if (!form.message.trim()) newErrors.message = 'Message is required.';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSent(true);
  };

  if (sent) {
    return (
      <div className="contact-success">
        <div className="contact-success-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="contact-success-title">Message Sent!</p>
        <p className="contact-success-body">Thanks for reaching out. Our team will get back to you within 1–2 business days.</p>
        <button className="contact-reset-btn" onClick={() => { setSent(false); setForm({ name: '', email: '', topic: '', message: '' }); }}>
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-row">
        <div className="contact-field">
          <label className="contact-label" htmlFor="support-name">Full Name</label>
          <input
            id="support-name"
            name="name"
            type="text"
            className="contact-input"
            placeholder="John Doe"
            value={form.name}
            onChange={handleChange}
            required
          />
          {errors.name && <span className="contact-error">{errors.name}</span>}
        </div>
        <div className="contact-field">
          <label className="contact-label" htmlFor="support-email">Email Address</label>
          <input
            id="support-email"
            name="email"
            type="email"
            className="contact-input"
            placeholder="john@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
          {errors.email && <span className="contact-error">{errors.email}</span>}
        </div>
      </div>

      <div className="contact-field">
        <label className="contact-label" htmlFor="support-topic">Topic</label>
        <select
          id="support-topic"
          name="topic"
          className="contact-input contact-select"
          value={form.topic}
          onChange={handleChange}
          required
        >
          <option value="" disabled>Select a topic…</option>
          {CONTACT_TOPICS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {errors.topic && <span className="contact-error">{errors.topic}</span>}
      </div>

      <div className="contact-field">
        <label className="contact-label" htmlFor="support-message">Message</label>
        <textarea
          id="support-message"
          name="message"
          className="contact-input contact-textarea"
          placeholder="Describe your issue or question in detail…"
          value={form.message}
          onChange={handleChange}
          required
          rows={5}
        />
        {errors.message && <span className="contact-error">{errors.message}</span>}
      </div>

      <div className="contact-info-row">
        <div className="contact-info-card">
          <div className="contact-info-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div>
            <p className="contact-info-label">Email</p>
            <p className="contact-info-value">support@parkit.com</p>
          </div>
        </div>
        <div className="contact-info-card">
          <div className="contact-info-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.45 2 2 0 0 1 3.59 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.79-.79a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.5a2 2 0 0 1-.08.92z"/>
            </svg>
          </div>
          <div>
            <p className="contact-info-label">Phone</p>
            <p className="contact-info-value">+61 2 9000 0000</p>
          </div>
        </div>
        <div className="contact-info-card">
          <div className="contact-info-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <p className="contact-info-label">Response Time</p>
            <p className="contact-info-value">1–2 Business Days</p>
          </div>
        </div>
      </div>

      <button type="submit" className="contact-submit-btn">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Send Message
      </button>
    </form>
  );
}

export default function Support() {
  const [activeTab, setActiveTab] = useState('account');
  const [search, setSearch] = useState('');

  const faqs = FAQS[activeTab] ?? [];
  const filtered = search.trim()
    ? faqs.filter(
        ({ q, a }) =>
          q.toLowerCase().includes(search.toLowerCase()) ||
          a.toLowerCase().includes(search.toLowerCase()),
      )
    : faqs;

  return (
    <div className="support-page">

      {/* ── Header ── */}
      <div className="support-hero">
        <div className="support-hero-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <h2 className="support-hero-title">Support Center</h2>
          <p className="support-hero-sub">How can we help you today?</p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="support-search-wrap">
        <svg className="support-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="support-search-input"
          type="text"
          placeholder="Search for a question…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" className="support-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Category tabs ── */}
      <div className="support-tabs">
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`support-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => { setActiveTab(id); setSearch(''); }}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── FAQ list or Contact form ── */}
      {activeTab === 'contact' ? (
        <div className="support-section">
          <p className="support-section-label">Contact Us</p>
          <div className="support-card contact-card">
            <ContactForm />
          </div>
        </div>
      ) : (
        <div className="support-section">
          <p className="support-section-label">
            Frequently Asked Questions
            {search && filtered.length > 0 && (
              <span className="support-result-count">&nbsp;· {filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            )}
          </p>

          {filtered.length > 0 ? (
            <div className="support-card faq-card">
              {filtered.map((item, i) => (
                <div key={item.q}>
                  <FaqItem question={item.q} answer={item.a} />
                  {i < filtered.length - 1 && <div className="faq-divider" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="support-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p className="support-empty-title">No results found</p>
              <p className="support-empty-body">Try a different keyword or browse another category.</p>
            </div>
          )}

          {/* Still need help? prompt */}
          <div className="support-still-help">
            <p className="support-still-help-text">Still need help?</p>
            <button
              className="support-still-help-btn"
              onClick={() => setActiveTab('contact')}
            >
              Contact Support
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
