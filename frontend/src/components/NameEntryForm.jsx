// frontend/src/components/NameEntryForm.jsx
import React, { useState } from 'react';

function NameEntryForm({ testId, setUserName }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem('appUserName', name.trim());
      setUserName(name.trim()); // Update the userName state in App.jsx
      // Redirect back to the test page with the name now set
      window.location.href = `/test/${testId}`;
    } else {
      alert('Please enter your name to proceed.'); // Using alert here for simplicity, consider a custom modal
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Enter Your Name</h2>
        <p className="text-lg text-gray-600 mb-6">Please provide your name to join the test waiting hall.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-800"
            required
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 text-xl"
          >
            Join Waiting Hall
          </button>
        </form>
      </div>
    </div>
  );
}

export default NameEntryForm;
