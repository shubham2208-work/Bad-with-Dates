import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Server, 
  Clock, 
  Zap,
  Star
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserAccount } from '../types/occasion';
import confetti from 'canvas-confetti';
import { NotificationService } from '../utils/notificationService';

interface WhatsAppAuthScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

const COUNTRY_CODES = [
  { code: '+1', country: 'US / Canada 🇺🇸' },
  { code: '+91', country: 'India 🇮🇳' },
  { code: '+44', country: 'UK 🇬🇧' },
  { code: '+61', country: 'Australia 🇦🇺' },
  { code: '+49', country: 'Germany 🇩🇪' },
  { code: '+33', country: 'France 🇫🇷' },
  { code: '+81', country: 'Japan 🇯🇵' },
  { code: '+971', country: 'UAE 🇦🇪' },
  { code: '+55', country: 'Brazil 🇧🇷' },
];

export const WhatsAppAuthScreen: React.FC<WhatsAppAuthScreenProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState<string>('+1');
  const [phoneDigits, setPhoneDigits] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [sentOtp, setSentOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fullPhoneNumber = `${countryCode}${phoneDigits.replace(/[^0-9]/g, '')}`;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phoneDigits.trim()) {
      setErrorMsg('Please enter your WhatsApp phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/whatsapp/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhoneNumber,
          name: name.trim() || 'WhatsApp User',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP.');
      }

      setSentOtp(data.demoOtp || '');
      setStep('otp');
      NotificationService.playCelebrationChime();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otp.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhoneNumber,
          otp: otp.trim(),
          name: name.trim() || 'WhatsApp User',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
      NotificationService.playCelebrationChime();

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    try {
      const demoPhone = '+14155550199';
      const res = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: demoPhone,
          otp: '123456',
          name: name.trim() || 'Sam Smith',
        }),
      });
      const data = await res.json();
      if (data.user) {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
        onLoginSuccess(data.user);
      }
    } catch (err) {
      console.error('Demo login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dot-pattern flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 font-sans">
      <div className="w-full max-w-md relative">
        {/* Playful Bauhaus Decorative Shapes behind card */}
        <div className="absolute -top-6 -left-6 w-16 h-16 bg-blue-500 border-2 border-black rotate-12 -z-0 hidden sm:block" />
        <div className="absolute -bottom-6 -right-6 w-20 h-10 bg-rose-400 border-2 border-black rounded-b-full -z-0 hidden sm:block" />
        <div className="absolute top-1/2 -right-8 w-10 h-10 bg-green-400 border-2 border-black -rotate-6 -z-0 hidden sm:block" />

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-[#fefbf3] border-[2.5px] border-black rounded-[28px] neo-shadow-lg p-6 sm:p-8 space-y-6"
        >
          {/* Header with Illustrated Character */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              {/* Circular line art avatar container */}
              <div className="w-20 h-20 rounded-full border-2 border-black bg-white mx-auto flex items-center justify-center neo-shadow overflow-hidden">
                <svg className="w-14 h-14" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5">
                  {/* Beanie Hat */}
                  <path d="M22 28C22 20 26 14 32 14C38 14 42 20 42 28" strokeLinecap="round" />
                  <path d="M20 28H44" strokeLinecap="round" />
                  <path d="M28 14L32 10L36 14" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Face */}
                  <path d="M23 28C23 35 27 41 32 41C37 41 41 35 41 28" />
                  {/* Eyes & Smile */}
                  <circle cx="28" cy="30" r="1.5" fill="black" />
                  <circle cx="36" cy="30" r="1.5" fill="black" />
                  <path d="M29 35C30.5 36.5 33.5 36.5 35 35" strokeLinecap="round" />
                  {/* Hair waves */}
                  <path d="M20 32C18 34 18 38 21 38" />
                  <path d="M44 32C46 34 46 38 43 38" />
                  {/* Neck & Shoulders */}
                  <path d="M29 41V46H35V41" />
                  <path d="M21 54C21 48 25 46 32 46C39 46 43 48 43 54" />
                </svg>
              </div>

              {/* Status Pill Badge */}
              <div className="absolute -bottom-1 -right-2 px-2 py-0.5 rounded-full bg-[#fde047] border-2 border-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 neo-shadow-sm">
                <Star className="w-3 h-3 fill-black text-black" />
                <span>100% Ready</span>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-black text-black tracking-tight">
                Bad with <span className="bg-[#fde047] px-2 py-0.5 rounded-md border border-black neo-shadow-sm">Dates</span>
              </h1>
              <p className="text-xs text-slate-600 mt-1.5 font-medium max-w-xs mx-auto">
                Sign in with your WhatsApp number. We send wishes on your behalf <strong>even when the web app is closed!</strong>
              </p>
            </div>
          </div>

          {/* 24/7 Cloud Background Guarantee Box */}
          <div className="p-3.5 rounded-2xl bg-amber-100 border-2 border-black neo-shadow-sm flex items-start gap-3 text-xs">
            <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
              <Zap className="w-4 h-4 text-amber-300" />
            </div>
            <div className="space-y-0.5">
              <div className="font-extrabold text-black">Autonomous Cloud Dispatch:</div>
              <p className="text-slate-700 text-[11px] leading-snug">
                Once scheduled, our cloud daemon dispatches your wish at 12:01 AM or your chosen time. <strong>No need to keep any browser tab open.</strong>
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-100 border-2 border-rose-500 text-rose-800 text-xs text-center font-bold">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Phone & Name Input */}
          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sam Smith or Alex"
                  className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-black text-black text-xs sm:text-sm font-semibold neo-shadow-sm focus:outline-none focus:bg-amber-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                  Your WhatsApp Phone Number *
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-36 px-2.5 py-3 rounded-2xl bg-white border-2 border-black text-black text-xs font-bold neo-shadow-sm focus:outline-none"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.country} ({c.code})
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={phoneDigits}
                      onChange={(e) => setPhoneDigits(e.target.value)}
                      placeholder="415 555 0199"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-black text-black text-xs sm:text-sm font-bold neo-shadow-sm focus:outline-none focus:bg-amber-50"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-black text-xs sm:text-sm font-black border-2 border-black neo-btn transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Sending Code...' : 'Get WhatsApp Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: Enter OTP Code */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs text-slate-600 font-medium">
                  Verification code sent to <strong className="text-black">{fullPhoneNumber}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="block mx-auto text-[11px] text-slate-500 hover:text-black underline font-bold"
                >
                  Change number
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5 text-center">
                  Enter 6-Digit WhatsApp Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full py-3 px-4 text-center tracking-[0.4em] font-mono font-black text-xl rounded-2xl bg-white border-2 border-black text-black neo-shadow-sm focus:outline-none focus:bg-amber-50"
                />
              </div>

              {sentOtp && (
                <div className="p-3 rounded-xl bg-amber-50 border-2 border-black text-center text-xs neo-shadow-sm">
                  <span className="text-slate-600 font-medium">Demo WhatsApp Code: </span>
                  <strong className="text-black font-mono text-sm tracking-widest bg-yellow-200 px-2 py-0.5 rounded border border-black">{sentOtp}</strong>
                  <button
                    type="button"
                    onClick={() => setOtp(sentOtp)}
                    className="ml-2 text-[11px] text-blue-700 font-extrabold underline hover:text-blue-900"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-black text-xs sm:text-sm font-black border-2 border-black neo-btn transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Verifying...' : 'Verify & Enter'}</span>
              </button>
            </form>
          )}

          {/* Quick Demo Bypass */}
          <div className="pt-2 border-t-2 border-dashed border-slate-300 text-center">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border-2 border-black text-xs font-bold text-slate-800 transition neo-shadow-sm inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>1-Click Test Login (Sam Smith • +1 415 555 0199)</span>
            </button>
          </div>

          <div className="text-[11px] text-center text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted • 24/7 Autonomous Cloud Dispatch</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
