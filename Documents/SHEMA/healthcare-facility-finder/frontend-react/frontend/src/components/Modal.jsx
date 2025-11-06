import React from 'react';
import { Check, X, Search, LogOut, Shield } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  const iconBgColor = type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : 'bg-blue-100';
  const iconColor = type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-blue-600';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`w-20 h-20 ${iconBgColor} rounded-full flex items-center justify-center mb-6`}>
            <div className={`w-12 h-12 ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'} rounded-lg flex items-center justify-center`}>
              {type === 'success' ? (
                <Check className="w-7 h-7 text-white" strokeWidth={3} />
              ) : type === 'error' ? (
                <X className="w-7 h-7 text-white" strokeWidth={3} />
              ) : (
                <Shield className="w-7 h-7 text-white" strokeWidth={3} />
              )}
            </div>
          </div>

          {/* Message */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {title || (type === 'success' ? 'Success!' : 'Notice')}
          </h2>
          <p className="text-gray-600 mb-8">
            {message}
          </p>

          {/* OK Button */}
          <button
            onClick={onClose}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;