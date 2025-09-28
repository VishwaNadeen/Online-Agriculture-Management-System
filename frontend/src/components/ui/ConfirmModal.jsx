import React from 'react';

const ConfirmModal = ({ open, title = 'Are you sure?', message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, danger = false }) => {
  if (!open) return null;
  const stop = (e) => e.stopPropagation();
  const handleOverlayClick = (e) => { e.stopPropagation(); onCancel && onCancel(); };
  const handleCancel = (e) => { e.stopPropagation(); onCancel && onCancel(); };
  const handleConfirm = (e) => { e.stopPropagation(); onConfirm && onConfirm(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={stop} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={handleOverlayClick} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6" onClick={stop}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {message && <p className="text-gray-600 mb-6">{message}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={handleCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{cancelText}</button>
          <button onClick={handleConfirm} className={`px-4 py-2 rounded-lg text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
