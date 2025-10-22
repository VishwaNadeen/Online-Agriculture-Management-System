import React from 'react';

const AdminLoader = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
        </div>
        <p className="text-lg font-medium text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default AdminLoader;
