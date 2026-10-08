
import { CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function AlertModal({ alert, onClose }) {
  if (!alert) return null;

  const { open, type = 'info', message = '' } = alert;
  if (!open) return null;

  const icons = {
    success: <CheckCircleIcon className="w-12 h-12 text-green-500" />,
    error: <ExclamationCircleIcon className="w-12 h-12 text-red-500" />,
    loading: <ArrowPathIcon className="w-12 h-12 text-blue-500 animate-spin" />,
    info: <InformationCircleIcon className="w-12 h-12 text-blue-400" />,
  };

  const bgColors = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    loading: 'bg-blue-50',
    info: 'bg-blue-50',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`p-6 rounded-2xl shadow-xl text-center w-80 ${bgColors[type]}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="flex justify-center mb-3">{icons[type]}</div>
            <p className="text-gray-700 font-medium">{message}</p>

            {type !== 'loading' && (
              <button
                onClick={onClose}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Aceptar
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
