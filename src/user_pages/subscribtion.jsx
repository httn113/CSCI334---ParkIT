import './Subscribtion.css';
import PricingCard from '../components/PricingCard';
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";


const TIERS = [
  {
    id: 'standard',
    variant: 'standard',
    name: 'Standard',
    price: 'Free',
    priceNote: '',
    includes: null,
    features: [
      'Book spots online up to 2 days in advance.',
      'Single booking up to 3 hours.',
      'Standard booking fees.',
      'Contactless payment: quick entry and exit using QR codes or e-wallets.',
      'Loyalty points: earn points for every hour parked.',
    ],
    ctaLabel: 'Get Started',  // Changed from 'Current plan'
  },
  {
    id: 'premium',
    variant: 'premium',
    name: 'Premium',
    price: '$15.99',
    priceNote: '/month',
    includes: 'Everything in Standard, plus:',
    features: [
      '✓ 10% discount on all bookings',
      'Lower booking fees during non-busy times (Coming Soon)',
      'Single booking up to 24 hours (Coming Soon)',
      '"Time expiring" alerts (Coming Soon)',
      'Special gift voucher during birthday month (Coming Soon)',
      'Double loyalty points during non-busy times (Coming Soon)',
      'Oversized and minivan spots (Coming Soon)',
    ],
    ctaLabel: 'Upgrade to Premium',
  },
  {
    id: 'gold',
    variant: 'gold',
    name: 'Gold',
    price: '$49.99',
    priceNote: '/month',
    includes: 'Everything in Premium, plus:',
    features: [
      '✓ 20% discount on all bookings',
      'Priority spots, always available (Coming Soon)',
      '24 hours of free parking each month (Coming Soon)',
      'Book for non-registered vehicles (Coming Soon)',
      'Concierge support (Coming Soon)',
      'Extended booking up to 48 hours (Coming Soon)',
      'VIP event parking access (Coming Soon)',
    ],
    ctaLabel: 'Upgrade to Gold',
  },
];
const COMPARISON_ROWS = [
  {
    feature: 'Booking discount',
    highlightValues: true,
    standard: { kind: 'text', value: 'None' },
    premium: { kind: 'text', value: '10% discount' },
    gold: { kind: 'text', value: '20% discount' },
  },
  {
    feature: 'Max duration',
    highlightValues: true,
    standard: { kind: 'text', value: '3 hours' },
    premium: { kind: 'text', value: '24 hours', coming_soon: true },
    gold: { kind: 'text', value: 'Unlimited', coming_soon: true },
  },
  {
    feature: 'Off-peak rates',
    standard: { kind: 'bool', value: false },
    premium: { kind: 'bool', value: true, coming_soon: true },
    gold: { kind: 'bool', value: true, coming_soon: true },
  },
  {
    feature: 'Live alerts',
    standard: { kind: 'bool', value: false },
    premium: { kind: 'bool', value: true, coming_soon: true },
    gold: { kind: 'bool', value: true, coming_soon: true },
  },
  {
    feature: 'Lower penalty',
    standard: { kind: 'bool', value: false },
    premium: { kind: 'bool', value: true, coming_soon: true },
    gold: { kind: 'bool', value: true, coming_soon: true },
  },
  {
    feature: 'Priority spots',
    standard: { kind: 'bool', value: false },
    premium: { kind: 'bool', value: false },
    gold: { kind: 'bool', value: true, coming_soon: true },
  },
  {
    feature: 'Guest booking',
    standard: { kind: 'bool', value: false },
    premium: { kind: 'bool', value: false },
    gold: { kind: 'bool', value: true, coming_soon: true },
  },
];
function CompareCell({ cell, highlight }) {
  if (cell.kind === 'text') {
    return (
      <span className={`subscribtion-compare-text${highlight ? ' subscribtion-compare-text--green' : ''}`}>
        {cell.value}
        {cell.coming_soon && <span className="subscribtion-coming-soon"> (Coming Soon)</span>}
      </span>
    );
  }
  if (cell.coming_soon && cell.value) {
    return <span className="subscribtion-coming-soon-badge">Coming Soon</span>;
  }
  return (
    <span
      className={
        cell.value
          ? 'subscribtion-compare-icon subscribtion-compare-icon--yes'
          : 'subscribtion-compare-icon subscribtion-compare-icon--no'
      }
      aria-label={cell.value ? 'Included' : 'Not included'}
    >
      {cell.value ? '✓' : '✗'}
    </span>
  );
}

export default function Subscribtion() {
  const [currentPlan, setCurrentPlan] = useState('standard');
  const navigate = useNavigate();

  // Fetch current subscription on mount
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/protected/subscription/current`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentPlan(data.plan || 'standard');
        }
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
      }
    };
    fetchSubscription();
  }, []);

  const handleUpgradeClick = async (planId) => {
    if (planId === currentPlan) {
      alert(`You are already on the ${planId} plan`);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/protected/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planId }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentPlan(planId);
        alert(`Successfully upgraded to ${planId} plan! You now get ${data.discount}% discount.`);
      } else {
        const err = await res.json();
        alert(`Upgrade failed: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Upgrade failed:", err);
      alert('Upgrade failed. Please try again.');
    }
  };
  return (
    <div className="subscribtion-page">
      <header className="subscribtion-hero">
        <h1 className="subscribtion-hero-title">Subscription</h1>
        <p className="subscribtion-hero-sub">
          Pick the plan that fits how you park. Upgrade anytime for longer bookings, better rates off-peak, and extra perks.
        </p>
      </header>

      <div className="subscribtion-grid">
        {TIERS.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={{
              ...tier,
              ctaLabel: tier.id === currentPlan ? 'Current plan' : tier.ctaLabel,
              ctaCurrent: tier.id === currentPlan,
            }}
            onCtaClick={() => handleUpgradeClick(tier.id)}
            isDisabled={tier.id === currentPlan}
          />
        ))}
      </div>

      <section className="subscribtion-compare" aria-labelledby="subscribtion-compare-heading">
        <h2 id="subscribtion-compare-heading" className="subscribtion-compare-title">
          Compare plans
        </h2>
        <div className="subscribtion-compare-scroll">
          <table className="subscribtion-compare-table">
            <thead>
              <tr>
                <th scope="col" className="subscribtion-compare-feature">
                  Features
                </th>
                <th scope="col">Standard</th>
                <th scope="col">Premium</th>
                <th scope="col">Gold</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <th scope="row" className="subscribtion-compare-feature">
                    {row.feature}
                  </th>
                  <td><CompareCell cell={row.standard} highlight={row.highlightValues} /></td>
                  <td><CompareCell cell={row.premium} highlight={row.highlightValues} /></td>
                  <td><CompareCell cell={row.gold} highlight={row.highlightValues} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
