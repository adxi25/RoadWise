import React, { useState } from 'react';
import { Shield, Lock, KeyRound, AlertCircle, X, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function AuthorityLoginModal({ isOpen, onClose, onLogin }) {
  const [passkey, setPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setError('Please enter the Municipal Access Passkey.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      const success = onLogin(passkey.trim());
      setIsSubmitting(false);
      if (!success) {
        setError('Invalid Municipal Passkey. Access restricted to authorized personnel.');
      } else {
        setPasskey('');
        setError('');
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DFE3E1] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="bg-[#0F1E1C] text-white p-5 flex items-start justify-between border-b border-[#1D3632]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                Restricted Government Portal
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Municipal Authority Access (Mode 2)
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Cancel and return to Citizen Portal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-xs text-[#505E63] leading-relaxed">
            This administrative area is restricted to Public Works Department (PWD), highway engineers, and municipal maintenance coordinators.
          </p>

          {/* Passkey Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#141D20] flex items-center justify-between">
              <span>Authority Passkey / PIN:</span>
              <span className="text-[11px] font-mono text-emerald-700 font-normal bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Demo: <span className="font-bold">roadwise2026</span>
              </span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#79888E] pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passkey}
                onChange={(e) => {
                  setPasskey(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter authority passkey..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#CCDCD8] bg-[#F8F7F4] text-sm text-[#141D20] font-mono placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-[#114B44] focus:bg-white transition-all"
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#79888E] hover:text-[#141D20] p-0.5"
                title={showPassword ? 'Hide passkey' : 'Show passkey'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#DFE3E1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#505E63] hover:text-[#141D20] hover:bg-[#F3F1EC] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !passkey.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#114B44] hover:bg-[#0D3833] active:bg-[#0A2A26] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-xs transition-colors"
            >
              {isSubmitting ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock Authority Dashboard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

