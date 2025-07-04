// frontend/src/components/Modal.jsx
import React from 'react';

function Modal({ title, message, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
        <p className="text-lg text-gray-700 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default Modal;
