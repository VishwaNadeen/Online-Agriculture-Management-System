import { useState } from "react"; 
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
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

      // store token under common keys
      if (token) {
        store.setItem("auth_token", token);
        store.setItem("token", token); // <-- Community auth checks this
      }

      if (user) {
        // keep your original key
        store.setItem("auth_user", JSON.stringify(user));
        // ALSO store under 'user' so other modules can find it
        store.setItem("user", JSON.stringify(user));

        // compute a simple display name for Community headers
        const display =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.name ||
          user.username ||
          (user.email && String(user.email).split("@")[0]) ||
          "User";
        store.setItem("userName", display); // <-- Community reads this

        // optional: keep userId handy
        if (user._id) localStorage.setItem("userId", user._id);

        toast.success(`Welcome, ${display}!`);
      } else {
        toast.success("Login successful");
      }

      // notify rest of app
      window.dispatchEvent(new Event("auth-changed"));

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
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-2xl rounded-2xl p-8 border border-emerald-100">
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-emerald-600 mb-6">
            Log in to continue to <span className="font-semibold">Green Grow</span>
          </p>

          {err && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-emerald-800 mb-1">
                Email or Phone
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-900 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="user@example.com or +9471XXXXXXX"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-emerald-800 mb-1">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 pr-10 text-emerald-900 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-emerald-500 hover:text-emerald-700"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                      <path strokeWidth="2" d="M3 3l18 18" />
                      <path strokeWidth="2" d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-3.42M9.88 5.5A9.77 9.77 0 0112 5c5 0 9.27 3.11 10.74 7.5a11.86 11.86 0 01-2.57 3.86M6.1 6.1A11.94 11.94 0 001.26 12.5 11.9 11.9 0 007 18.5a11.7 11.7 0 003.1 1.27" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                      <path strokeWidth="2" d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12 18 19.5 12 19.5 2.25 12 2.25 12z" />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-emerald-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-white font-medium hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-emerald-700">
            Don’t have an account?{" "}
            <Link
              to="/userRegistration"
              className="font-medium text-emerald-600 hover:text-emerald-700"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-emerald-600">
          By signing in, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
