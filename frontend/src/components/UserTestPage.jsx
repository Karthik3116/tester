
// // frontend/src/components/UserTestPage.jsx
// import React, { useState, useEffect, useCallback } from 'react';
// import { useParams } from 'react-router-dom';
// import io from 'socket.io-client';
// import { useAuth } from '../App'; // Use useAuth hook
// import LoadingSpinner from './LoadingSpinner';
// import QuizQuestion from './QuizQuestion';

// function UserTestPage() {
//   const { userId, userName, token, showAppModal } = useAuth(); // Get auth context
//   const { testId } = useParams(); // Get testId from URL params
//   const [testData, setTestData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [socket, setSocket] = useState(null);
//   const [countdown, setCountdown] = useState(null);
//   const [testStarted, setTestStarted] = useState(false);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [userAnswers, setUserAnswers] = useState({}); // { questionIndex: selectedOption }
//   const [showResults, setShowResults] = useState(false);
//   const [finalScore, setFinalScore] = useState(null);
//   const [isSubmitted, setIsSubmitted] = useState(false);

//   const backendUrl = import.meta.env.VITE_BACKEND_URL;

//   // Memoize handleSubmitTest
//   const handleSubmitTest = useCallback(async () => {
//     if (isSubmitted) return;

//     setLoading(true);
//     try {
//       const answersArray = Object.keys(userAnswers).map(index => ({
//         questionIndex: parseInt(index),
//         selectedOption: userAnswers[index]
//       }));

//       const response = await fetch(`${backendUrl}/api/tests/${testId}/submit`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}` // Include JWT token
//         },
//         body: JSON.stringify({ answers: answersArray }) // userId, userName derived from token on backend
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to submit test');
//       }

//       const data = await response.json();
//       setFinalScore(data.score);
//       setShowResults(true);
//       setIsSubmitted(true);
//       showAppModal('Test Submitted!', `Your score: ${data.score} out of ${data.totalQuestions}`);

//     } catch (err) {
//       console.error('Error submitting test:', err);
//       showAppModal('Submission Error', `Failed to submit test: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [backendUrl, testId, userId, userName, userAnswers, isSubmitted, token, showAppModal]);


//   // Initial fetch of test data and join test
//   useEffect(() => {
//     // These checks are now handled by ProtectedRoute, but good to have as a final safeguard
//     if (!testId || !userId || !userName || !token) {
//       console.warn("UserTestPage: Missing testId, userId, userName, or token. This should be handled by ProtectedRoute.");
//       setError("Authentication or test information is missing. Please ensure you are logged in.");
//       setLoading(false);
//       return;
//     }
//     if (!backendUrl) {
//       console.error("VITE_BACKEND_URL is not defined. Cannot connect to backend.");
//       setError("Application configuration error: Backend URL is missing. Please check your frontend/.env file and restart the development server.");
//       setLoading(false);
//       return;
//     }

//     const fetchTestDataAndJoin = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         // 1. Fetch test data
//         console.log(`Fetching test data for testId: ${testId} from ${backendUrl}/api/tests/${testId}`);
//         const testResponse = await fetch(`${backendUrl}/api/tests/${testId}`, {
//           headers: { 'Authorization': `Bearer ${token}` } // Include JWT token
//         });
//         if (!testResponse.ok) {
//           const errorText = await testResponse.text();
//           console.error(`Error fetching test data (status: ${testResponse.status}):`, errorText);
//           if (errorText.trim().startsWith('<!doctype html>')) {
//             throw new Error(`Server returned HTML (status: ${testResponse.status}). Is the backend running and accessible at ${backendUrl}?`);
//           }
//           try {
//             const errorData = JSON.parse(errorText);
//             throw new Error(errorData.message || `Failed to fetch test data: HTTP status ${testResponse.status}`);
//           } catch (jsonParseError) {
//             throw new Error(`Failed to fetch test data: Response was not valid JSON. Raw: ${errorText.substring(0, 100)}...`);
//           }
//         }
//         const initialTestData = await testResponse.json();
//         setTestData(initialTestData);
//         setTestStarted(initialTestData.status === 'active');

//         // 2. Join the test via API (updates participants list in MongoDB)
//         console.log(`Attempting to join test ${testId} as ${userName} (${userId})`);
//         const joinResponse = await fetch(`${backendUrl}/api/tests/${testId}/join`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}` // Include JWT token
//           },
//           body: JSON.stringify({}) // userId, userName derived from token on backend
//         });

//         if (!joinResponse.ok) {
//           const errorText = await joinResponse.text();
//           console.error(`Error joining test (status: ${joinResponse.status}):`, errorText);
//           if (errorText.trim().startsWith('<!doctype html>')) {
//             throw new Error(`Server returned HTML when joining test (status: ${joinResponse.status}). Backend issue?`);
//           }
//           try {
//             const errorData = JSON.parse(errorText);
//             throw new Error(errorData.message || `Failed to join test: HTTP status ${joinResponse.status}`);
//           } catch (jsonParseError) {
//             throw new Error(`Failed to join test: Response was not valid JSON. Raw: ${errorText.substring(0, 100)}...`);
//           }
//         }

//         const joinData = await joinResponse.json();
//         setTestData(joinData.testData);

//         setLoading(false);

//         // 3. Initialize Socket.IO connection
//         console.log(`Connecting to Socket.IO at ${backendUrl}`);
//         const newSocket = io(backendUrl);
//         setSocket(newSocket);

//         newSocket.on('connect', () => {
//           console.log('Socket.IO connected:', newSocket.id);
//           newSocket.emit('joinTestRoom', testId);
//         });

//         newSocket.on('testUpdate', (data) => {
//           console.log('Received testUpdate:', data);
//           setTestData(prev => {
//             const updatedData = { ...prev, participants: data.participants, status: data.status, startTime: data.startTime, duration: data.duration }; // Include duration
//             setTestStarted(updatedData.status === 'active');
//             return updatedData;
//           });
//         });

//         newSocket.on('testStarted', (data) => {
//           console.log('Test started event received:', data);
//           setTestStarted(true);
//           setTestData(prev => ({ ...prev, status: 'active', startTime: data.startTime, duration: data.duration })); // Include duration
//           showAppModal('Test Started!', 'The test has begun! Good luck!');
//         });

//         newSocket.on('testEnded', () => { // New event listener for test ending
//           console.log('Test ended event received.');
//           setTestStarted(false); // Stop the test
//           setCountdown(0); // Ensure countdown shows 0
//           showAppModal('Test Ended', 'The administrator has ended the test.');
//           // Optionally, auto-submit if not already submitted
//           if (!isSubmitted) {
//             handleSubmitTest();
//           }
//         });

//         newSocket.on('disconnect', () => {
//           console.log('Socket.IO disconnected.');
//         });

//         return () => {
//           console.log('Disconnecting Socket.IO on component unmount.');
//           newSocket.disconnect();
//         };

//       } catch (err) {
//         console.error('Error in fetchTestDataAndJoin:', err);
//         setError(`Failed to load test: ${err.message}`);
//         setLoading(false);
//       }
//     };

//     fetchTestDataAndJoin();
//   }, [testId, userId, userName, backendUrl, token, showAppModal, isSubmitted, handleSubmitTest]);

//   // Countdown logic
//   useEffect(() => {
//     // Use testData.duration if available, otherwise default to 10 minutes (600 seconds)
//     const testDurationSeconds = testData?.duration ? testData.duration * 60 : 600;

//     if (!testData || testData.status !== 'active' || !testData.startTime) {
//       setCountdown(null);
//       return;
//     }

//     const startTimestamp = new Date(testData.startTime).getTime();

//     const interval = setInterval(() => {
//       const now = Date.now();
//       const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
//       const remainingSeconds = testDurationSeconds - elapsedSeconds;

//       if (remainingSeconds <= 0) {
//         clearInterval(interval);
//         setCountdown(0);
//         if (!isSubmitted) {
//           showAppModal('Time Expired!', 'The test time has run out. Your answers will be submitted automatically.');
//           handleSubmitTest();
//         }
//       } else {
//         setCountdown(remainingSeconds);
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [testData, isSubmitted, handleSubmitTest, showAppModal]);


//   const handleOptionSelect = (questionIndex, selectedOption) => {
//     setUserAnswers(prev => ({
//       ...prev,
//       [questionIndex]: selectedOption
//     }));
//   };

//   const handleNextQuestion = () => {
//     if (testData && currentQuestionIndex < testData.questions.length - 1) {
//       setCurrentQuestionIndex(prev => prev + 1);
//     } else if (testData) {
//       showAppModal('Ready to Submit?', 'You have answered all questions. Click "Submit Test" to finish.');
//     }
//   };

//   const handlePreviousQuestion = () => {
//     if (currentQuestionIndex > 0) {
//       setCurrentQuestionIndex(prev => prev - 1);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <LoadingSpinner />
//         <p className="ml-4 text-lg text-gray-700">Loading test data and connecting...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-red-50 bg-opacity-80 p-6">
//         <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
//           <h2 className="text-3xl font-bold text-red-600 mb-4">Error</h2>
//           <p className="text-lg text-gray-700 mb-6">{error}</p>
//           <button
//             onClick={() => window.location.href = '/'}
//             className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
//           >
//             Go to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!testData) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <p className="text-lg text-gray-700">No test data available after loading. Please ensure the test ID is correct and you are authenticated.</p>
//       </div>
//     );
//   }

//   const formatTime = (seconds) => {
//     if (seconds === null) return '--:--';
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-6 flex flex-col items-center">
//       <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-3xl mb-8">
//         <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-4">{testData.topic} Test</h1>
//         <p className="text-center text-gray-600 mb-6">Welcome, <span className="font-semibold text-blue-600">{userName}</span>! Your User ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded text-sm">{userId.substring(0, 8)}...</span></p>

//         {!testStarted && testData.status === 'created' && (
//           <div className="text-center p-6 bg-yellow-50 rounded-lg shadow-inner border border-yellow-200">
//             <h2 className="text-3xl font-bold text-yellow-800 mb-4">Waiting for Admin to Start Test...</h2>
//             <p className="text-xl text-gray-700 mb-4">
//               Participants in waiting hall: <span className="font-semibold">{testData.participants.length}</span>
//             </p>
//             <ul className="list-disc list-inside bg-white p-4 rounded-lg max-h-40 overflow-y-auto mx-auto w-fit shadow-sm">
//               {testData.participants.map((p, index) => (
//                 <li key={index} className="text-gray-700 py-0.5">
//                   {p.userName} (<span className="font-mono text-xs">{p.userId.substring(0, 8)}...</span>)
//                 </li>
//               ))}
//             </ul>
//             <p className="text-gray-600 mt-4 text-sm">
//               The test will begin once the administrator starts it. Please wait.
//             </p>
//           </div>
//         )}

//         {testStarted && testData.status === 'active' && !showResults && (
//           <div className="space-y-6">
//             <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg shadow-md border border-blue-200">
//               <h2 className="text-2xl font-bold text-blue-800">Question {currentQuestionIndex + 1} of {testData.questions.length}</h2>
//               <div className="text-2xl font-bold text-red-600">Time Left: {formatTime(countdown)}</div>
//             </div>

//             <QuizQuestion
//               question={testData.questions[currentQuestionIndex]}
//               questionIndex={currentQuestionIndex}
//               selectedOption={userAnswers[currentQuestionIndex]}
//               onOptionSelect={handleOptionSelect}
//             />

//             <div className="flex justify-between mt-6">
//               <button
//                 onClick={handlePreviousQuestion}
//                 disabled={currentQuestionIndex === 0 || loading}
//                 className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
//               >
//                 Previous
//               </button>
//               {currentQuestionIndex < testData.questions.length - 1 ? (
//                 <button
//                   onClick={handleNextQuestion}
//                   disabled={loading}
//                   className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
//                 >
//                   Next
//                 </button>
//               ) : (
//                 <button
//                   onClick={handleSubmitTest}
//                   disabled={loading || isSubmitted}
//                   className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
//                 >
//                   {loading ? <LoadingSpinner size="sm" /> : 'Submit Test'}
//                 </button>
//               )}
//             </div>
//           </div>
//         )}

//         {showResults && (
//           <div className="text-center p-6 bg-green-50 rounded-lg shadow-inner border border-green-200">
//             <h2 className="text-3xl font-bold text-green-800 mb-4">Test Completed!</h2>
//             <p className="text-xl text-gray-700 mb-6">
//               Your Score: <span className="font-extrabold text-4xl text-green-700">{finalScore}</span> / {testData.questions.length}
//             </p>
//             <button
//               onClick={() => window.location.href = '/'}
//               className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
//             >
//               Go to Home
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default UserTestPage;
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../App'; // Use useAuth hook
import LoadingSpinner from './LoadingSpinner';
import QuizQuestion from './QuizQuestion';

function UserTestPage() {
  const { userId, userName, token, showAppModal } = useAuth(); // Get auth context
  const { testId } = useParams(); // Get testId from URL params
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true); // For initial page load
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionIndex: selectedOption }
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false); // Tracks if test has been successfully submitted
  const [isSubmitting, setIsSubmitting] = useState(false); // Tracks if submission is in progress

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Memoize handleSubmitTest
  const handleSubmitTest = useCallback(async () => {
    // --- CRITICAL GUARD: Prevent multiple submissions or re-submission while already submitting ---
    if (isSubmitted || isSubmitting) {
      console.log('Submission already in progress or already submitted. Aborting.');
      return;
    }

    setIsSubmitting(true); // Start submitting loading state
    try {
      const answersArray = Object.keys(userAnswers).map(index => ({
        questionIndex: parseInt(index),
        selectedOption: userAnswers[index]
      }));

      console.log('Submitting test with answers:', answersArray);

      const response = await fetch(`${backendUrl}/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Include JWT token
        },
        body: JSON.stringify({ answers: answersArray }) // userId, userName derived from token on backend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit test');
      }

      const data = await response.json();
      setFinalScore(data.score);
      setShowResults(true);
      setIsSubmitted(true); // Mark as successfully submitted
      showAppModal('Test Submitted!', `Your score: ${data.score} out of ${data.totalQuestions}`);
      console.log('Test submitted successfully. Score:', data.score);

    } catch (err) {
      console.error('Error submitting test:', err);
      showAppModal('Submission Error', `Failed to submit test: ${err.message}`);
    } finally {
      setIsSubmitting(false); // End submitting loading state
    }
  }, [backendUrl, testId, userAnswers, isSubmitted, isSubmitting, token, showAppModal]);


  // Initial fetch of test data and join test
  useEffect(() => {
    if (!testId || !userId || !userName || !token) {
      console.warn("UserTestPage: Missing testId, userId, userName, or token. This should be handled by ProtectedRoute.");
      setError("Authentication or test information is missing. Please ensure you are logged in.");
      setLoading(false);
      return;
    }
    if (!backendUrl) {
      console.error("VITE_BACKEND_URL is not defined. Cannot connect to backend.");
      setError("Application configuration error: Backend URL is missing. Please check your frontend/.env file and restart the development server.");
      setLoading(false);
      return;
    }

    const fetchTestDataAndJoin = async () => {
      try {
        setLoading(true); // Start general loading for initial fetch
        setError(null);

        // 1. Fetch test data
        console.log(`Fetching test data for testId: ${testId} from ${backendUrl}/api/tests/${testId}`);
        const testResponse = await fetch(`${backendUrl}/api/tests/${testId}`, {
          headers: { 'Authorization': `Bearer ${token}` } // Include JWT token
        });
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error(`Error fetching test data (status: ${testResponse.status}):`, errorText);
          if (errorText.trim().startsWith('<!doctype html>')) {
            throw new Error(`Server returned HTML (status: ${testResponse.status}). Is the backend running and accessible at ${backendUrl}?`);
          }
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || `Failed to fetch test data: HTTP status ${testResponse.status}`);
          } catch (jsonParseError) {
            throw new Error(`Failed to fetch test data: Response was not valid JSON. Raw: ${errorText.substring(0, 100)}...`);
          }
        }
        const initialTestData = await testResponse.json();
        setTestData(initialTestData);
        // Set testStarted based on the initial fetch status
        setTestStarted(initialTestData.status === 'active');
        // If the test was already submitted, set the state accordingly
        if (initialTestData.status === 'completed' && initialTestData.userScores && initialTestData.userScores[userId]) {
            setFinalScore(initialTestData.userScores[userId].score);
            setShowResults(true);
            setIsSubmitted(true);
            console.log("Test already completed and score fetched:", initialTestData.userScores[userId].score);
        }


        // 2. Join the test via API (updates participants list in MongoDB)
        console.log(`Attempting to join test ${testId} as ${userName} (${userId})`);
        const joinResponse = await fetch(`${backendUrl}/api/tests/${testId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Include JWT token
          },
          body: JSON.stringify({}) // userId, userName derived from token on backend
        });

        if (!joinResponse.ok) {
          const errorText = await joinResponse.text();
          console.error(`Error joining test (status: ${joinResponse.status}):`, errorText);
          if (errorText.trim().startsWith('<!doctype html>')) {
            throw new Error(`Server returned HTML when joining test (status: ${joinResponse.status}). Backend issue?`);
          }
          try {
            const errorData = JSON.parse(errorText);
            // If the user already submitted and tries to join again,
            // the backend might return an error indicating it's completed for them.
            // In that case, we should still show results if we have them.
            if (errorData.message.includes("Test already completed for this user")) {
                console.warn("Attempted to join an already completed test. Showing existing results.");
                // We've already fetched testData, so userScores might be there.
                if (initialTestData.userScores && initialTestData.userScores[userId]) {
                    setFinalScore(initialTestData.userScores[userId].score);
                    setShowResults(true);
                    setIsSubmitted(true);
                } else {
                    // Fallback if score not immediately available on initial fetch (unlikely if backend is good)
                    showAppModal('Info', 'You have already completed this test.');
                }
                setLoading(false);
                return; // Stop further processing if already completed
            }
            throw new Error(errorData.message || `Failed to join test: HTTP status ${joinResponse.status}`);
          } catch (jsonParseError) {
            throw new Error(`Failed to join test: Response was not valid JSON. Raw: ${errorText.substring(0, 100)}...`);
          }
        }

        const joinData = await joinResponse.json();
        // Update testData with any new information from joining (e.g., updated participants)
        setTestData(joinData.testData);
        // Ensure testStarted reflects the most current status from the join response
        setTestStarted(joinData.testData.status === 'active');
        // If the join response indicates the test is completed for the user, update states
        if (joinData.testData.status === 'completed' && joinData.testData.userScores && joinData.testData.userScores[userId]) {
            setFinalScore(joinData.testData.userScores[userId].score);
            setShowResults(true);
            setIsSubmitted(true);
            console.log("Test already completed during join. Score:", joinData.testData.userScores[userId].score);
        }


        setLoading(false); // End general loading

        // 3. Initialize Socket.IO connection only if the test is not yet submitted
        if (!isSubmitted) {
            console.log(`Connecting to Socket.IO at ${backendUrl}`);
            const newSocket = io(backendUrl);
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Socket.IO connected:', newSocket.id);
                newSocket.emit('joinTestRoom', testId);
            });

            newSocket.on('testUpdate', (data) => {
                console.log('Received testUpdate:', data);
                setTestData(prev => {
                    const updatedData = { ...prev, participants: data.participants, status: data.status, startTime: data.startTime, duration: data.duration }; // Include duration
                    setTestStarted(updatedData.status === 'active');
                    return updatedData;
                });
            });

            newSocket.on('testStarted', (data) => {
                console.log('Test started event received:', data);
                setTestStarted(true);
                setTestData(prev => ({ ...prev, status: 'active', startTime: data.startTime, duration: data.duration })); // Include duration
                showAppModal('Test Started!', 'The test has begun! Good luck!');
            });

            newSocket.on('testEnded', () => {
                console.log('Test ended event received.');
                setTestStarted(false); // Stop the test
                setCountdown(0); // Ensure countdown shows 0
                showAppModal('Test Ended', 'The administrator has ended the test.');
                // Auto-submit if not already submitted or currently submitting
                handleSubmitTest(); // The guard inside handleSubmitTest will prevent double submission
            });

            newSocket.on('disconnect', () => {
                console.log('Socket.IO disconnected.');
            });

            return () => {
                console.log('Disconnecting Socket.IO on component unmount.');
                newSocket.disconnect();
            };
        } else {
            console.log("Test already submitted, skipping Socket.IO connection.");
        }

      } catch (err) {
        console.error('Error in fetchTestDataAndJoin:', err);
        setError(`Failed to load test: ${err.message}`);
        setLoading(false); // End general loading even on error
      }
    };

    fetchTestDataAndJoin();
    // Dependencies: only re-run if these fundamental identifiers change
    // handleSubmitTest is now a dependency due to useCallback's requirements,
    // but its internal guard makes its frequent re-creation less impactful.
  }, [testId, userId, userName, backendUrl, token, showAppModal, isSubmitted, handleSubmitTest]);


  // Countdown logic
  useEffect(() => {
    // Use testData.duration if available, otherwise default to 10 minutes (600 seconds)
    // testData.duration is in minutes, convert to seconds
    const testDurationSeconds = testData?.duration ? testData.duration * 60 : 600;

    if (!testData || testData.status !== 'active' || !testData.startTime || isSubmitted) {
      setCountdown(null);
      return;
    }

    const startTimestamp = new Date(testData.startTime).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
      const remainingSeconds = testDurationSeconds - elapsedSeconds;

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        setCountdown(0);
        // Auto-submit if time runs out and not already submitted
        handleSubmitTest(); // The guard inside handleSubmitTest will prevent double submission
      } else {
        setCountdown(remainingSeconds);
      }
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on unmount or dependency change
  }, [testData, isSubmitted, handleSubmitTest, showAppModal, userId]);


  const handleOptionSelect = (questionIndex, selectedOption) => {
    // This function should not trigger a loading state or full page reload
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption
    }));
  };

  const handleNextQuestion = () => {
    if (testData && currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (testData) {
      // If on the last question and clicking next, prompt to submit
      showAppModal('Ready to Submit?', 'You have answered all questions. Click "Submit Test" to finish.');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <LoadingSpinner />
        <p className="ml-4 text-lg text-gray-700">Loading test data and connecting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 bg-opacity-80 p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-lg text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">No test data available after loading. Please ensure the test ID is correct and you are authenticated.</p>
      </div>
    );
  }

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-6 flex flex-col items-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-3xl mb-8">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-4">{testData.topic} Test</h1>
        <p className="text-center text-gray-600 mb-6">Welcome, <span className="font-semibold text-blue-600">{userName}</span>! Your User ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded text-sm">{userId.substring(0, 8)}...</span></p>

        {!testStarted && testData.status === 'created' && !showResults && (
          <div className="text-center p-6 bg-yellow-50 rounded-lg shadow-inner border border-yellow-200">
            <h2 className="text-3xl font-bold text-yellow-800 mb-4">Waiting for Admin to Start Test...</h2>
            <p className="text-xl text-gray-700 mb-4">
              Participants in waiting hall: <span className="font-semibold">{testData.participants.length}</span>
            </p>
            <ul className="list-disc list-inside bg-white p-4 rounded-lg max-h-40 overflow-y-auto mx-auto w-fit shadow-sm">
              {testData.participants.map((p, index) => (
                <li key={index} className="text-gray-700 py-0.5">
                  {p.userName} (<span className="font-mono text-xs">{p.userId.substring(0, 8)}...</span>)
                </li>
              ))}
            </ul>
            <p className="text-gray-600 mt-4 text-sm">
              The test will begin once the administrator starts it. Please wait.
            </p>
          </div>
        )}

        {/* Display test content only if test has started and not showing results */}
        {testStarted && testData.status === 'active' && !showResults && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg shadow-md border border-blue-200">
              <h2 className="text-2xl font-bold text-blue-800">Question {currentQuestionIndex + 1} of {testData.questions.length}</h2>
              <div className="text-2xl font-bold text-red-600">Time Left: {formatTime(countdown)}</div>
            </div>

            <QuizQuestion
              question={testData.questions[currentQuestionIndex]}
              questionIndex={currentQuestionIndex}
              selectedOption={userAnswers[currentQuestionIndex]}
              onOptionSelect={handleOptionSelect}
            />

            <div className="flex justify-between mt-6">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0 || isSubmitting || isSubmitted} // Disable if submitting or submitted
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                Previous
              </button>
              {currentQuestionIndex < testData.questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  disabled={isSubmitting || isSubmitted} // Disable if submitting or submitted
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmitTest}
                  disabled={isSubmitting || isSubmitted} // Disable if submitting or already submitted
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {isSubmitting ? <LoadingSpinner size="sm" /> : 'Submit Test'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Display results if showResults is true (either submitted by user or auto-submitted) */}
        {showResults && (
          <div className="text-center p-6 bg-green-50 rounded-lg shadow-inner border border-green-200">
            <h2 className="text-3xl font-bold text-green-800 mb-4">Test Completed!</h2>
            <p className="text-xl text-gray-700 mb-6">
              Your Score: <span className="font-extrabold text-4xl text-green-700">{finalScore}</span> / {testData.questions.length}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
            >
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserTestPage;