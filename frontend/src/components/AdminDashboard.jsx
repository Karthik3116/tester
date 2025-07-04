
// // frontend/src/components/AdminDashboard.jsx
// import React, { useState, useEffect, useCallback } from 'react';
// import { useAuth } from '../App'; // Use useAuth hook
// import LoadingSpinner from './LoadingSpinner';

// function AdminDashboard() {
//   const { userId, userName, userRole, token, showAppModal } = useAuth(); // Get auth context
//   const [topic, setTopic] = useState('');
//   const [numQuestions, setNumQuestions] = useState(5);
//   const [testDuration, setTestDuration] = useState(60); // New state for test duration in minutes
//   const [loading, setLoading] = useState(false); // General loading for actions
//   const [loadingSelectedTestDetails, setLoadingSelectedTestDetails] = useState(false); // Specific loading for details pane
//   const [tests, setTests] = useState([]);
//   const [selectedTest, setSelectedTest] = useState(null);
//   const [testParticipants, setTestParticipants] = useState([]);
//   const [testResults, setTestResults] = useState([]);
//   const [activeTab, setActiveTab] = useState('create'); // 'create', 'manage', 'results'

//   const backendUrl = import.meta.env.VITE_BACKEND_URL;

//   // Function to fetch tests created by this admin
//   const fetchAdminTests = useCallback(async () => {
//     if (!backendUrl || !userId || userRole !== 'admin') {
//       console.warn("Cannot fetch admin tests: Backend URL, userId, or admin role missing/incorrect.");
//       return;
//     }
//     setLoading(true);
//     try {
//       const response = await fetch(`${backendUrl}/api/admin/tests`, { // No :adminId in URL, it's derived from token
//         headers: {
//           'Authorization': `Bearer ${token}` // Include JWT token
//         }
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('Non-OK response received:', response.status, errorText);
//         if (errorText.trim().startsWith('<!doctype html>')) {
//             throw new Error(`Server returned HTML (status: ${response.status}). Is the backend running and accessible at ${backendUrl}?`);
//         }
//         try {
//             const errorData = JSON.parse(errorText);
//             throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//         } catch (jsonParseError) {
//             throw new Error(`HTTP error! status: ${response.status}. Response was not valid JSON. Raw: ${errorText.substring(0, 100)}...`);
//         }
//       }

//       const data = await response.json();
//       setTests(data);
//     } catch (error) {
//       console.error("Error fetching admin tests:", error);
//       showAppModal('Error', `Failed to fetch your tests: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [backendUrl, userId, userRole, token, showAppModal]);

//   // Initial fetch of admin tests
//   useEffect(() => {
//     if (userRole === 'admin') { // Only fetch if user is an admin
//       fetchAdminTests();
//     }
//   }, [fetchAdminTests, userRole]);

//   // Listen for real-time updates on a selected test (participants, status)
//   // This useEffect now explicitly fetches the latest details for the selected test.
//   useEffect(() => {
//     if (!selectedTest?.testId || !backendUrl || userRole !== 'admin') return;

//     const testIdToFetch = selectedTest.testId;

//     const fetchSelectedTestDetails = async () => {
//       setLoadingSelectedTestDetails(true); // Start loading for details pane
//       try {
//         const response = await fetch(`${backendUrl}/api/tests/${testIdToFetch}`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         });
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const data = await response.json();
//         setSelectedTest(data); // Update with the latest details (status, participants, etc.)
//         setTestParticipants(data.participants || []); // Use the latest participants from fetched data
//       } catch (error) {
//         console.error("Error fetching selected test details:", error);
//         showAppModal('Error', `Failed to get test details: ${error.message}`);
//       } finally {
//         setLoadingSelectedTestDetails(false); // End loading for details pane
//       }
//     };

//     fetchSelectedTestDetails();
//   }, [selectedTest?.testId, backendUrl, token, userRole, showAppModal]); // Depend on testId for stability


//   // Fetch results for a selected test
//   const fetchTestResults = useCallback(async (testId) => {
//     if (!backendUrl || userRole !== 'admin') {
//       console.error("VITE_BACKEND_URL is not defined or user is not admin for fetching test results.");
//       return;
//     }
//     setLoading(true);
//     try {
//       const response = await fetch(`${backendUrl}/api/admin/results/${testId}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       setTestResults(data);
//     } catch (error) {
//       console.error('Error fetching test results:', error);
//       showAppModal('Error', `Failed to fetch test results: ${error.message}`);
//       setTestResults([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [backendUrl, token, userRole, showAppModal]);

//   const handleCreateTest = async (e) => {
//     e.preventDefault();
//     if (!topic || numQuestions < 1 || testDuration < 1 || !userId || !backendUrl || userRole !== 'admin') {
//       showAppModal('Validation Error', 'Please provide a topic, a valid number of questions, a valid duration, and ensure you are logged in as an admin.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await fetch(`${backendUrl}/api/tests/create`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         // Include new 'duration' field in the request body
//         body: JSON.stringify({ topic, numQuestions, duration: testDuration }) // adminId is derived from token on backend
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to create test');
//       }

//       const data = await response.json();
//       showAppModal('Success', `Test "${topic}" created! Share this link with users: ${window.location.origin}/test/${data.testId}`);
//       setTopic('');
//       setNumQuestions(5);
//       setTestDuration(60); // Reset duration after successful creation
//       fetchAdminTests(); // Refresh the list of tests
//     } catch (error) {
//       console.error('Error creating test:', error);
//       showAppModal('Error', `Failed to create test: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartTest = async () => {
//     if (!selectedTest || !backendUrl || userRole !== 'admin') {
//       showAppModal('No Test Selected', 'Please select a test to start and ensure you are logged in as an admin.');
//       return;
//     }
//     if (selectedTest.status !== 'created') {
//       showAppModal('Test Already Started', 'This test has already been started or completed.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await fetch(`${backendUrl}/api/tests/${selectedTest.testId}/start`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({}) // adminId is derived from token on backend
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to start test');
//       }

//       showAppModal('Test Started!', `Test "${selectedTest.topic}" has started.`);
//       fetchAdminTests(); // Refresh test status in the list
//       // Re-fetch selected test details to update its status and participants immediately
//       const updatedSelectedTestResponse = await fetch(`${backendUrl}/api/tests/${selectedTest.testId}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (updatedSelectedTestResponse.ok) {
//         const updatedSelectedTestData = await updatedSelectedTestResponse.json();
//         setSelectedTest(updatedSelectedTestData);
//         setTestParticipants(updatedSelectedTestData.participants || []);
//       }

//     } catch (error) {
//       console.error('Error starting test:', error);
//       showAppModal('Error', `Failed to start test: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEndTest = async () => {
//     if (!selectedTest || !backendUrl || userRole !== 'admin') {
//       showAppModal('No Test Selected', 'Please select a test to end and ensure you are logged in as an admin.');
//       return;
//     }
//     if (selectedTest.status !== 'active') {
//       showAppModal('Test Not Active', 'This test is not currently active.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await fetch(`${backendUrl}/api/tests/${selectedTest.testId}/end`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({}) // adminId is derived from token on backend
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to end test');
//       }

//       showAppModal('Test Ended!', `Test "${selectedTest.topic}" has ended.`);
//       fetchAdminTests(); // Refresh test status in the list
//       const updatedSelectedTestResponse = await fetch(`${backendUrl}/api/tests/${selectedTest.testId}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (updatedSelectedTestResponse.ok) {
//         const updatedSelectedTestData = await updatedSelectedTestResponse.json();
//         setSelectedTest(updatedSelectedTestData);
//       }
//     } catch (error) {
//       console.error('Error ending test:', error);
//       showAppModal('Error', `Failed to end test: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCopyLink = (testId) => {
//     const testLink = `${window.location.origin}/test/${testId}`;
//     navigator.clipboard.writeText(testLink)
//       .then(() => showAppModal('Link Copied!', 'Test link copied to clipboard.'))
//       .catch(err => showAppModal('Copy Failed', 'Failed to copy link. Please copy manually.'));
//   };

//   const renderTestStatus = (status) => {
//     switch (status) {
//       case 'created': return <span className="px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">Created</span>;
//       case 'active': return <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">Active</span>;
//       case 'completed': return <span className="px-3 py-1 text-sm font-semibold text-purple-800 bg-purple-100 rounded-full">Completed</span>;
//       default: return <span className="px-3 py-1 text-sm font-semibold text-gray-800 bg-gray-100 rounded-full">Unknown</span>;
//     }
//   };

//   if (userRole !== 'admin') {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-red-50 p-6">
//         <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
//           <h2 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h2>
//           <p className="text-lg text-gray-700 mb-6">You must be logged in as an administrator to access this page.</p>
//           <a href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105">Go to Login</a>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
//       <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-5xl mx-auto">
//         <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">Admin Dashboard</h1>
//         <p className="text-center text-gray-600 mb-6">Logged in as: <span className="font-semibold text-blue-600">{userName}</span> (Admin ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded text-sm">{userId.substring(0, 8)}...</span>)</p>


//         <div className="flex justify-center mb-6 border-b border-gray-200">
//           <button
//             className={`py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200 ${activeTab === 'create' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}
//             onClick={() => setActiveTab('create')}
//           >
//             Create New Test
//           </button>
//           <button
//             className={`py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200 ${activeTab === 'manage' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}
//             onClick={() => { setActiveTab('manage'); setSelectedTest(null); setTestParticipants([]); setTestResults([]); fetchAdminTests(); }}
//           >
//             Manage Tests
//           </button>
//           <button
//             className={`py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200 ${activeTab === 'results' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}
//             onClick={() => { setActiveTab('results'); setSelectedTest(null); setTestParticipants([]); setTestResults([]); fetchAdminTests(); }}
//           >
//             View Results
//           </button>
//         </div>

//         {activeTab === 'create' && (
//           <div className="bg-gray-50 p-8 rounded-lg shadow-inner">
//             <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Generate a New Quiz</h2>
//             <form onSubmit={handleCreateTest} className="space-y-6">
//               <div>
//                 <label htmlFor="topic" className="block text-gray-700 text-lg font-semibold mb-2">Quiz Topic:</label>
//                 <input
//                   type="text"
//                   id="topic"
//                   className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
//                   value={topic}
//                   onChange={(e) => setTopic(e.target.value)}
//                   placeholder="e.g., General Knowledge, Science, History"
//                   required
//                 />
//               </div>
//               <div>
//                 <label htmlFor="numQuestions" className="block text-gray-700 text-lg font-semibold mb-2">Number of Questions:</label>
//                 <input
//                   type="number"
//                   id="numQuestions"
//                   className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
//                   value={numQuestions}
//                   onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
//                   min="1"
//                   required
//                 />
//               </div>
//               {/* New field for Test Duration */}
//               <div>
//                 <label htmlFor="testDuration" className="block text-gray-700 text-lg font-semibold mb-2">Test Duration (minutes):</label>
//                 <input
//                   type="number"
//                   id="testDuration"
//                   className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
//                   value={testDuration}
//                   onChange={(e) => setTestDuration(Math.max(1, parseInt(e.target.value) || 1))}
//                   min="1"
//                   required
//                 />
//               </div>
//               <button
//                 type="submit"
//                 className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105 flex items-center justify-center text-xl"
//                 disabled={loading}
//               >
//                 {loading ? <LoadingSpinner size="sm" /> : 'Create Test'}
//               </button>
//             </form>
//           </div>
//         )}

//         {activeTab === 'manage' && (
//           <div className="bg-gray-50 p-8 rounded-lg shadow-inner">
//             <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Tests</h2>
//             {tests.length === 0 && !loading ? (
//               <p className="text-center text-gray-600 text-lg">No tests created yet. Go to the "Create New Test" tab.</p>
//             ) : (
//               <ul className="space-y-4">
//                 {tests.map(test => (
//                   <li key={test.testId} className={`p-4 border rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center transition duration-200 ${selectedTest && selectedTest.testId === test.testId ? 'bg-blue-100 border-blue-400' : 'bg-white hover:bg-gray-100 border-gray-200'}`}>
//                     <div className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
//                       {test.topic} ({test.questions.length} Qs) - {renderTestStatus(test.status)}
//                     </div>
//                     <div className="flex flex-wrap justify-center sm:justify-end gap-3">
//                       <button
//                         onClick={() => { setSelectedTest(test); setTestParticipants([]); setTestResults([]); }} // Clear participants/results immediately
//                         className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-200"
//                       >
//                         Details
//                       </button>
//                       <button
//                         onClick={() => handleCopyLink(test.testId)}
//                         className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-200"
//                       >
//                         Copy Link
//                       </button>
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             )}

//             {selectedTest && (
//               <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border border-blue-200">
//                 {loadingSelectedTestDetails ? (
//                   <div className="flex justify-center items-center h-32">
//                     <LoadingSpinner /> <p className="ml-2 text-gray-700">Loading test details...</p>
//                   </div>
//                 ) : (
//                   <>
//                     <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Selected Test: {selectedTest.topic}</h3>
//                     <p className="text-gray-700 mb-2"><strong>Test ID:</strong> <span className="font-mono text-sm bg-gray-100 p-1 rounded">{selectedTest.testId}</span></p>
//                     <p className="text-gray-700 mb-2"><strong>Status:</strong> {renderTestStatus(selectedTest.status)}</p>
//                     {/* Display Test Duration */}
//                     <p className="text-gray-700 mb-4"><strong>Duration:</strong> {selectedTest.duration} minutes</p>

//                     <div className="flex justify-center gap-4 mb-6">
//                       {selectedTest.status === 'created' && (
//                         <button
//                           onClick={handleStartTest}
//                           disabled={loading}
//                           className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50 text-lg"
//                         >
//                           {loading ? <LoadingSpinner size="sm" /> : 'Start Test'}
//                         </button>
//                       )}
//                       {selectedTest.status === 'active' && (
//                         <button
//                           onClick={handleEndTest}
//                           disabled={loading}
//                           className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50 text-lg"
//                         >
//                           {loading ? <LoadingSpinner size="sm" /> : 'End Test'}
//                         </button>
//                       )}
//                     </div>

//                     <h4 className="text-xl font-bold text-gray-800 mb-3">Participants ({testParticipants.length}):</h4>
//                     {testParticipants.length === 0 ? (
//                       <p className="text-gray-600">No participants have joined yet.</p>
//                     ) : (
//                       <ul className="list-disc list-inside bg-gray-100 p-4 rounded-md max-h-48 overflow-y-auto">
//                         {testParticipants.map((p, index) => (
//                           <li key={index} className="text-gray-700 py-0.5">{p.userName} (<span className="font-mono text-xs">{p.userId.substring(0, 8)}...</span>)</li>
//                         ))}
//                       </ul>
//                     )}
//                   </>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === 'results' && (
//           <div className="bg-gray-50 p-8 rounded-lg shadow-inner">
//             <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Test Results</h2>
//             {tests.length === 0 ? (
//               <p className="text-center text-gray-600 text-lg">No tests available to view results for.</p>
//             ) : (
//               <div className="mb-6">
//                 <label htmlFor="selectTestForResults" className="block text-gray-700 text-lg font-semibold mb-2">Select Test:</label>
//                 <select
//                   id="selectTestForResults"
//                   className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
//                   onChange={(e) => {
//                     const selected = tests.find(t => t.testId === e.target.value);
//                     setSelectedTest(selected);
//                     if (selected) {
//                       fetchTestResults(selected.testId);
//                     } else {
//                       setTestResults([]);
//                     }
//                   }}
//                   value={selectedTest ? selectedTest.testId : ''}
//                 >
//                   <option value="">-- Select a Test --</option>
//                   {tests.filter(t => t.status === 'completed').map(test => (
//                     <option key={test.testId} value={test.testId}>
//                       {test.topic} ({test.status})
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             {selectedTest && testResults.length > 0 && (
//               <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border border-blue-200">
//                 <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Results for: {selectedTest.topic}</h3>
//                 <p className="text-gray-700 mb-4 text-center">Total Questions: {selectedTest.questions.length}</p>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full bg-white border border-gray-200 rounded-lg">
//                     <thead>
//                       <tr className="bg-gray-100 border-b">
//                         <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Participant Name</th>
//                         <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">User ID</th>
//                         <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Score</th>
//                         <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Submission Time</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {testResults.map((result, index) => (
//                         <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
//                           <td className="py-3 px-4 text-gray-800">{result.userName}</td>
//                           <td className="py-3 px-4 text-gray-600 font-mono text-sm">{result.userId.substring(0, 8)}...</td>
//                           <td className="py-3 px-4 text-gray-800 font-semibold">{result.score}</td>
//                           <td className="py-3 px-4 text-gray-600 text-sm">
//                             {new Date(result.submittedAt).toLocaleString()}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             {selectedTest && testResults.length === 0 && selectedTest.status === 'completed' && (
//               <p className="mt-8 text-center text-gray-600 text-lg">No results submitted for this completed test yet.</p>
//             )}
//             {selectedTest && selectedTest.status !== 'completed' && (
//               <p className="mt-8 text-center text-gray-600 text-lg">Results are available only for completed tests.</p>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default AdminDashboard;

// frontend/src/components/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App'; // Use useAuth hook
import LoadingSpinner from './LoadingSpinner';

function AdminDashboard() {
  const { userId, userName, userRole, token, showAppModal } = useAuth(); // Get auth context
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [testDuration, setTestDuration] = useState(60); // New state for test duration in minutes
  const [loading, setLoading] = useState(false); // General loading for actions
  const [loadingSelectedTestDetails, setLoadingSelectedTestDetails] = useState(false); // Specific loading for details pane
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testParticipants, setTestParticipants] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'manage', 'results'

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Function to fetch tests created by this admin
  const fetchAdminTests = useCallback(async () => {
    if (!backendUrl || !userId || userRole !== 'admin') {
      console.warn("Cannot fetch admin tests: Backend URL, userId, or admin role missing/incorrect.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/tests`, { // No :adminId in URL, it's derived from token
        headers: {
          'Authorization': `Bearer ${token}` // Include JWT token
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Non-OK response received:', response.status, errorText);
        if (errorText.trim().startsWith('<!doctype html>')) {
            throw new Error(`Server returned HTML (status: ${response.status}). Is the backend running and accessible at ${backendUrl}?`);
        }
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (jsonParseError) {
            throw new Error(`HTTP error! status: ${response.status}. Response was not valid JSON. Raw: ${errorText.substring(0, 100)}...`);
        }
      }

      const data = await response.json();
      setTests(data);
    } catch (error) {
      console.error("Error fetching admin tests:", error);
      showAppModal('Error', `Failed to fetch your tests: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, userId, userRole, token, showAppModal]);

  // Initial fetch of admin tests
  useEffect(() => {
    if (userRole === 'admin') { // Only fetch if user is an admin
      fetchAdminTests();
    }
  }, [fetchAdminTests, userRole]);

  // Listen for real-time updates on a selected test (participants, status)
  // This useEffect now explicitly fetches the latest details for the selected test.
  useEffect(() => {
    if (!selectedTest?.testId || !backendUrl || userRole !== 'admin') return;

    const testIdToFetch = selectedTest.testId;

    const fetchSelectedTestDetails = async () => {
      setLoadingSelectedTestDetails(true); // Start loading for details pane
      try {
        const response = await fetch(`${backendUrl}/api/tests/${testIdToFetch}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSelectedTest(data); // Update with the latest details (status, participants, etc.)
        setTestParticipants(data.participants || []); // Use the latest participants from fetched data
      } catch (error) {
        console.error("Error fetching selected test details:", error);
        showAppModal('Error', `Failed to get test details: ${error.message}`);
      } finally {
        setLoadingSelectedTestDetails(false); // End loading for details pane
      }
    };

    fetchSelectedTestDetails();
  }, [selectedTest?.testId, backendUrl, token, userRole, showAppModal]); // Depend on testId for stability


  // Fetch results for a selected test
  const fetchTestResults = useCallback(async (testId) => {
    if (!backendUrl || userRole !== 'admin') {
      console.error("VITE_BACKEND_URL is not defined or user is not admin for fetching test results.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/results/${testId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Error fetching test results:', error);
      showAppModal('Error', `Failed to fetch test results: ${error.message}`);
      setTestResults([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token, userRole, showAppModal]);

  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (!topic || numQuestions < 1 || testDuration < 1 || !userId || !backendUrl || userRole !== 'admin') {
      showAppModal('Validation Error', 'Please provide a topic, a valid number of questions, a valid duration, and ensure you are logged in as an admin.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/tests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Include new 'duration' field in the request body
        body: JSON.stringify({ topic, numQuestions, duration: testDuration }) // adminId is derived from token on backend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create test');
      }

      const data = await response.json();
      showAppModal('Success', `Test "${topic}" created! Share this link with users: ${window.location.origin}/test/${data.testId}`);
      setTopic('');
      setNumQuestions(5);
      setTestDuration(60); // Reset duration after successful creation
      fetchAdminTests(); // Refresh the list of tests
    } catch (error) {
      console.error('Error creating test:', error);
      showAppModal('Error', `Failed to create test: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!selectedTest || !backendUrl || userRole !== 'admin') {
      showAppModal('No Test Selected', 'Please select a test to start and ensure you are logged in as an admin.');
      return;
    }
    if (selectedTest.status !== 'created') {
      showAppModal('Test Already Started', 'This test has already been started or completed.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/tests/${selectedTest.testId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}) // adminId is derived from token on backend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start test');
      }

      showAppModal('Test Started!', `Test "${selectedTest.topic}" has started.`);
      fetchAdminTests(); // Refresh test status in the list
      // Re-fetch selected test details to update its status and participants immediately
      const updatedSelectedTestResponse = await fetch(`${backendUrl}/api/tests/${selectedTest.testId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (updatedSelectedTestResponse.ok) {
        const updatedSelectedTestData = await updatedSelectedTestResponse.json();
        setSelectedTest(updatedSelectedTestData);
        setTestParticipants(updatedSelectedTestData.participants || []);
      }

    } catch (error) {
      console.error('Error starting test:', error);
      showAppModal('Error', `Failed to start test: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEndTest = async () => {
    if (!selectedTest || !backendUrl || userRole !== 'admin') {
      showAppModal('No Test Selected', 'Please select a test to end and ensure you are logged in as an admin.');
      return;
    }
    if (selectedTest.status !== 'active') {
      showAppModal('Test Not Active', 'This test is not currently active.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/tests/${selectedTest.testId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}) // adminId is derived from token on backend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to end test');
      }

      showAppModal('Test Ended!', `Test "${selectedTest.topic}" has ended.`);
      fetchAdminTests(); // Refresh test status in the list
      const updatedSelectedTestResponse = await fetch(`${backendUrl}/api/tests/${selectedTest.testId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (updatedSelectedTestResponse.ok) {
        const updatedSelectedTestData = await updatedSelectedTestResponse.json();
        setSelectedTest(updatedSelectedTestData);
      }
    } catch (error) {
      console.error('Error ending test:', error);
      showAppModal('Error', `Failed to end test: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (testId) => {
    const testLink = `${window.location.origin}/test/${testId}`;
    navigator.clipboard.writeText(testLink)
      .then(() => showAppModal('Link Copied!', 'Test link copied to clipboard.'))
      .catch(err => showAppModal('Copy Failed', 'Failed to copy link. Please copy manually.'));
  };

  const renderTestStatus = (status) => {
    switch (status) {
      case 'created': return <span className="px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">Created</span>;
      case 'active': return <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">Active</span>;
      case 'completed': return <span className="px-3 py-1 text-sm font-semibold text-purple-800 bg-purple-100 rounded-full">Completed</span>;
      default: return <span className="px-3 py-1 text-sm font-semibold text-gray-800 bg-gray-100 rounded-full">Unknown</span>;
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-lg text-gray-700 mb-6">You must be logged in as an administrator to access this page.</p>
          <a href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">Admin Dashboard</h1>
        <p className="text-center text-gray-600 mb-6">Logged in as: <span className="font-semibold text-blue-600">{userName}</span> (Admin ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded text-sm">{userId.substring(0, 8)}...</span>)</p>


        <div className="flex justify-center mb-6 border-b border-gray-200">
          <button
            className={`py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200 ${activeTab === 'create' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('create')}
          >
            Create New Test
          </button>
          <button
            className={`py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200 ${activeTab === 'manage' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}
            onClick={() => { setActiveTab('manage'); setSelectedTest(null); setTestParticipants([]); setTestResults([]); fetchAdminTests(); }}
          >
            Manage Tests
          </button>
          <button
            className={`py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200 ${activeTab === 'results' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}
            onClick={() => { setActiveTab('results'); setSelectedTest(null); setTestParticipants([]); setTestResults([]); fetchAdminTests(); }}
          >
            View Results
          </button>
        </div>

        {activeTab === 'create' && (
          <div className="bg-gray-50 p-8 rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Generate a New Quiz</h2>
            <form onSubmit={handleCreateTest} className="space-y-6">
              <div>
                <label htmlFor="topic" className="block text-gray-700 text-lg font-semibold mb-2">Quiz Topic:</label>
                <input
                  type="text"
                  id="topic"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., General Knowledge, Science, History"
                  required
                />
              </div>
              <div>
                <label htmlFor="numQuestions" className="block text-gray-700 text-lg font-semibold mb-2">Number of Questions:</label>
                <input
                  type="number"
                  id="numQuestions"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  required
                />
              </div>
              {/* New field for Test Duration */}
              <div>
                <label htmlFor="testDuration" className="block text-gray-700 text-lg font-semibold mb-2">Test Duration (minutes):</label>
                <input
                  type="number"
                  id="testDuration"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  value={testDuration}
                  onChange={(e) => setTestDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105 flex items-center justify-center text-xl"
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Create Test'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="bg-gray-50 p-8 rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Tests</h2>
            {tests.length === 0 && !loading ? (
              <p className="text-center text-gray-600 text-lg">No tests created yet. Go to the "Create New Test" tab.</p>
            ) : (
              <ul className="space-y-4">
                {tests.map(test => (
                  <li key={test.testId} className={`p-4 border rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center transition duration-200 ${selectedTest && selectedTest.testId === test.testId ? 'bg-blue-100 border-blue-400' : 'bg-white hover:bg-gray-100 border-gray-200'}`}>
                    <div className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
                      {test.topic} ({test.questions.length} Qs) - {renderTestStatus(test.status)}
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-end gap-3">
                      <button
                        onClick={() => { setSelectedTest(test); setTestParticipants([]); setTestResults([]); }} // Clear participants/results immediately
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-200"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleCopyLink(test.testId)}
                        className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-200"
                      >
                        Copy Link
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {selectedTest && (
              <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border border-blue-200">
                {loadingSelectedTestDetails ? (
                  <div className="flex justify-center items-center h-32">
                    <LoadingSpinner /> <p className="ml-2 text-gray-700">Loading test details...</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Selected Test: {selectedTest.topic}</h3>
                    <p className="text-gray-700 mb-2"><strong>Test ID:</strong> <span className="font-mono text-sm bg-gray-100 p-1 rounded">{selectedTest.testId}</span></p>
                    <p className="text-gray-700 mb-2"><strong>Status:</strong> {renderTestStatus(selectedTest.status)}</p>
                    {/* Display Test Duration */}
                    <p className="text-gray-700 mb-4"><strong>Duration:</strong> {selectedTest.duration} minutes</p>

                    <div className="flex justify-center gap-4 mb-6">
                      {selectedTest.status === 'created' && (
                        <button
                          onClick={handleStartTest}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50 text-lg"
                        >
                          {loading ? <LoadingSpinner size="sm" /> : 'Start Test'}
                        </button>
                      )}
                      {selectedTest.status === 'active' && (
                        <button
                          onClick={handleEndTest}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50 text-lg"
                        >
                          {loading ? <LoadingSpinner size="sm" /> : 'End Test'}
                        </button>
                      )}
                    </div>

                    <h4 className="text-xl font-bold text-gray-800 mb-3">Participants ({testParticipants.length}):</h4>
                    {testParticipants.length === 0 ? (
                      <p className="text-gray-600">No participants have joined yet.</p>
                    ) : (
                      <ul className="list-disc list-inside bg-gray-100 p-4 rounded-md max-h-48 overflow-y-auto">
                        {testParticipants.map((p, index) => (
                          <li key={index} className="text-gray-700 py-0.5">{p.userName} (<span className="font-mono text-xs">{p.userId.substring(0, 8)}...</span>)</li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-gray-50 p-8 rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Test Results</h2>
            {tests.length === 0 ? (
              <p className="text-center text-gray-600 text-lg">No tests available to view results for.</p>
            ) : (
              <div className="mb-6">
                <label htmlFor="selectTestForResults" className="block text-gray-700 text-lg font-semibold mb-2">Select Test:</label>
                <select
                  id="selectTestForResults"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  onChange={(e) => {
                    const selected = tests.find(t => t.testId === e.target.value);
                    setSelectedTest(selected);
                    if (selected) {
                      fetchTestResults(selected.testId);
                    } else {
                      setTestResults([]);
                    }
                  }}
                  value={selectedTest ? selectedTest.testId : ''}
                >
                  <option value="">-- Select a Test --</option>
                  {tests.filter(t => t.status === 'completed').map(test => (
                    <option key={test.testId} value={test.testId}>
                      {test.topic} ({test.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedTest && testResults.length > 0 && (
              <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border border-blue-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Results for: {selectedTest.topic}</h3>
                <p className="text-gray-700 mb-4 text-center">Total Questions: {selectedTest.questions.length}</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Participant Name</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">User ID</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Score</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Submission Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.map((result, index) => (
                        <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-800">{result.userName}</td>
                          <td className="py-3 px-4 text-gray-600 font-mono text-sm">{result.userId.substring(0, 8)}...</td>
                          <td className="py-3 px-4 text-gray-800 font-semibold">{result.score}</td>
                          <td className="py-3 px-4 text-gray-600 text-sm">
                            {new Date(result.submittedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedTest && testResults.length === 0 && selectedTest.status === 'completed' && (
              <p className="mt-8 text-center text-gray-600 text-lg">No results submitted for this completed test yet.</p>
            )}
            {selectedTest && selectedTest.status !== 'completed' && (
              <p className="mt-8 text-center text-gray-600 text-lg">Results are available only for completed tests.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;