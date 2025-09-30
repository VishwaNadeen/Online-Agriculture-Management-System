// src/components/StatusChip.jsx
export default function StatusChip({ status }) {
  const map = {
    pending:   "bg-amber-100 text-amber-800",
    confirmed: "bg-green-100 text-green-800",
    declined:  "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
    completed: "bg-sky-100 text-sky-800",
  };
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${map[status] || "bg-gray-100"}`}>
      {status}
    </span>
  );
}
