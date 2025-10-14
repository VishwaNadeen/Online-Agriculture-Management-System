/* eslint-disable react/prop-types */
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="absolute inset-x-0 top-20 mx-auto w-[min(100%,480px)] px-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="border-b border-gray-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="px-5 py-4 text-sm text-gray-700">
            {message}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
            <button
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-gray-200 hover:bg-gray-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
