'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Loader2, Send, ShieldCheck, ArrowLeft } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type LoginStep = 'username' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('username');
  const [username, setUsername] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || 'Failed to send OTP';
        setError(msg);
        showToast(msg, 'error');
        return;
      }

      showToast('OTP sent to your Telegram!', 'success');
      setStep('otp');
      setCountdown(data.expiresIn || 300);
      setOtpDigits(['', '', '', '', '', '']);
      // Focus first OTP input after render
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      const msg = 'Unable to connect to server. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length !== 6) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), code }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || 'Invalid OTP';
        setError(msg);
        showToast(msg, 'error');
        // Clear OTP fields on error
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        return;
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Login successful', 'success');
      router.push('/dashboard');
    } catch {
      const msg = 'Unable to connect to server. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (digit && index === 5) {
      const code = newDigits.join('');
      if (code.length === 6) {
        // Small delay to let state update
        setTimeout(() => handleVerifyOtp(), 100);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const code = otpDigits.join('');
      if (code.length === 6) {
        handleVerifyOtp();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < paste.length && i < 6; i++) {
      newDigits[i] = paste[i];
    }
    setOtpDigits(newDigits);
    if (paste.length >= 6) {
      setTimeout(() => handleVerifyOtp(), 100);
    } else {
      otpRefs.current[paste.length]?.focus();
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJWMGgydjM0em0tNCAwVjBoLTJ2MzRoMnptLTQgMFYwaC0ydjM0aDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Systematic Web</h1>
          <p className="text-slate-400 mt-2">Sign in with Telegram OTP</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white text-center">
              {step === 'username' ? 'Welcome back' : 'Enter OTP'}
            </CardTitle>
            <CardDescription className="text-slate-400 text-center">
              {step === 'username'
                ? 'Enter your username to receive OTP on Telegram'
                : `OTP sent to Telegram for ${username}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-in fade-in slide-in-from-top-1 mb-4">
                {error}
              </div>
            )}

            {step === 'username' ? (
              /* Step 1: Username */
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-300">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50"
                      required
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 transition-all duration-200"
                  disabled={loading || !username.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send OTP to Telegram
                    </>
                  )}
                </Button>

                {/* Telegram bot link helper */}
                <div className="text-center">
                  <p className="text-xs text-slate-500">
                    First time? Message{' '}
                    <a
                      href="https://t.me/Pb_otpbot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      @Pb_otpbot
                    </a>{' '}
                    on Telegram, then ask admin to link your account.
                  </p>
                </div>
              </form>
            ) : (
              /* Step 2: OTP Verification */
              <div className="space-y-6">
                {/* Telegram icon indicator */}
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <ShieldCheck className="h-7 w-7 text-blue-400" />
                  </div>
                </div>

                {/* OTP Input Grid */}
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ))}
                </div>

                {/* Countdown */}
                {countdown > 0 && (
                  <p className="text-center text-sm text-slate-400">
                    OTP expires in <span className="text-blue-400 font-medium">{formatCountdown(countdown)}</span>
                  </p>
                )}

                {/* Verify Button */}
                <Button
                  onClick={handleVerifyOtp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-11 transition-all duration-200"
                  disabled={loading || otpDigits.join('').length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Verify & Sign In
                    </>
                  )}
                </Button>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { setStep('username'); setError(''); setOtpDigits(['', '', '', '', '', '']); }}
                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Change username
                  </button>
                  <button
                    onClick={() => { if (countdown <= 0) handleRequestOtp(); }}
                    disabled={countdown > 0 || loading}
                    className={`text-sm transition-colors ${
                      countdown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'
                    }`}
                  >
                    {countdown > 0 ? `Resend in ${formatCountdown(countdown)}` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Systematic Web &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
