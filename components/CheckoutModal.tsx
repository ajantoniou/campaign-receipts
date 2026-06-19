'use client';
import { useState } from 'react';

export function CheckoutModal({ 
  isOpen, 
  onClose, 
  marketId, 
  title, 
  price 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  marketId?: string, 
  title: string, 
  price: string 
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = () => {
    setLoading(true);
    // Simulate redirect to Stripe / LemonSqueezy
    setTimeout(() => {
      alert(`Redirecting to payment processor for ${title} at ${price}...`);
      setLoading(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface border border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-xl font-display font-bold text-white mb-2">Secure Checkout</h2>
        <div className="p-4 bg-background border border-white/5 rounded-lg mb-6">
          <div className="text-sm text-text-muted mb-1">Item</div>
          <div className="font-medium text-white mb-4">{title}</div>
          
          <div className="flex justify-between items-center border-t border-white/10 pt-4">
            <span className="text-sm text-text-muted">Total</span>
            <span className="text-2xl font-mono font-bold text-success">{price}</span>
          </div>
        </div>

        <ul className="space-y-3 mb-8 text-sm text-text-muted">
          <li className="flex items-center gap-2">
            <span className="text-success">✓</span> Instant access to proprietary donor intelligence
          </li>
          <li className="flex items-center gap-2">
            <span className="text-success">✓</span> Automated email alerts for new FEC filings
          </li>
          <li className="flex items-center gap-2">
            <span className="text-success">✓</span> Secure payment processing
          </li>
        </ul>

        <button 
          onClick={handleCheckout}
          disabled={loading}
          className="w-full btn-primary py-3 text-lg relative group overflow-hidden"
        >
          <span className="relative z-10">{loading ? 'Processing...' : 'Pay with Card'}</span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        </button>
      </div>
    </div>
  );
}
