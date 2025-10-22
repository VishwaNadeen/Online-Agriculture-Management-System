import { useState, useEffect } from "react"; 
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Leaf, Mail, Lock, Eye, EyeOff } from "lucide-react";
import API from "../../utils/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const from = location.state?.from || "/";

  const validate = () => {
    if (!emailOrPhone.trim()) return "Please enter your email or phone number.";
    if (!password) return "Please enter your password.";
    const v = emailOrPhone.trim();
    const looksEmail = v.includes("@");
    const looksPhone = /^[+0-9][0-9+]*$/.test(v);
    if (!looksEmail && !looksPhone) return "Use a valid email or phone number.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const vErr = validate();
    if (vErr) return setErr(vErr);

    setLoading(true);
    try {
      const { data } = await API.post("/users/login", {
        emailOrPhone: emailOrPhone.trim(),
        password,
      });

      const token = data?.token;
      const user  = data?.user;
      const store = remember ? localStorage : sessionStorage;

      if (token) {
        store.setItem("auth_token", token);
        store.setItem("token", token);
      }

      if (user) {
        store.setItem("auth_user", JSON.stringify(user));
        store.setItem("user", JSON.stringify(user));

        const display =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.name ||
          user.username ||
          (user.email && String(user.email).split("@")[0]) ||
          "User";
        store.setItem("userName", display);

        if (user._id) localStorage.setItem("userId", user._id);

        // Only show welcome toast for non-admin users
        if (user?.role !== "admin") {
          toast.success(`Welcome, ${display}!`);
        }
      } else {
        toast.success("Login successful");
      }

      window.dispatchEvent(new Event("auth-changed"));

      if (user?.role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      navigate(from, { replace: true });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Login failed. Please try again.";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 px-4 py-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-white shadow-2xl rounded-3xl p-8 border border-emerald-100/50 backdrop-blur-sm relative overflow-hidden">
          {/* Decorative top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />
          
          {/* Logo/Brand */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="flex items-center gap-3 group">
                <div className="relative">
                  <Leaf className="w-10 h-10 text-emerald-600 transition-transform duration-300 group-hover:rotate-12" />
                  <div className="absolute inset-0 bg-emerald-400 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
                  Green Grow
                </span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-emerald-800 mb-2 text-center">
            Welcome back
          </h1>
          <p className="text-sm text-emerald-600 mb-8 text-center">
            Log in to continue to <span className="font-semibold">Green Grow</span>
          </p>

          {err && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm animate-shake">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{err}</span>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email/Phone Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-emerald-800 mb-2">
                Email or Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type="text"
                  className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 pl-10 pr-4 py-3 text-emerald-900 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                  placeholder="user@example.com or +9471XXXXXXX"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-emerald-800">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type={showPw ? "text" : "password"}
                  className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 pl-10 pr-12 py-3 text-emerald-900 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-emerald-500 hover:text-emerald-700 transition-colors duration-200"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 text-sm text-emerald-700 cursor-pointer group">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2 transition-all cursor-pointer"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="group-hover:text-emerald-800 transition-colors">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3.5 text-white font-semibold hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02] transform"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 pt-6 border-t border-emerald-100">
            <p className="text-sm text-emerald-700 text-center">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-emerald-600">
          By signing in, you agree to our{" "}
          <a href="#" className="underline hover:text-emerald-700 transition-colors">Terms</a>
          {" "}and{" "}
          <a href="#" className="underline hover:text-emerald-700 transition-colors">Privacy Policy</a>.
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
