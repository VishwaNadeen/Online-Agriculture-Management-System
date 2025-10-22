// src/pages/VerifyCode.jsx
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function VerifyCode() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/users/password/verify", { email, code });
      toast.success("Code verified. You can now set a new password.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Verify Reset Code</h2>
      <form onSubmit={handleVerify}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full rounded mb-4"
          required
        />
        <input
          type="text"
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border p-2 w-full rounded mb-4"
          required
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          Verify Code
        </button>
      </form>
    </div>
  );
}
