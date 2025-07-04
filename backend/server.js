// // backend/server.js

// // Import necessary modules
// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs'); // For password hashing
// const jwt = require('jsonwebtoken'); // For JSON Web Tokens
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// require('dotenv').config(); // Load environment variables from .env file

// // --- MongoDB Connection ---
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/competition_app';

// mongoose.connect(MONGODB_URI)
//   .then(() => console.log('MongoDB connected successfully'))
//   .catch(err => {
//     console.error('MongoDB connection error:', err);
//     process.exit(1); // Exit if MongoDB fails to connect
//   });

// // --- Mongoose Schemas and Models ---

// // User Schema
// const UserSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, required: true, enum: ['user', 'admin'], default: 'user' },
//   createdAt: { type: Date, default: Date.now }
// });

// // Pre-save hook to hash password before saving
// UserSchema.pre('save', async function (next) {
//   if (this.isModified('password')) {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//   }
//   next();
// });

// // Method to compare passwords
// UserSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// const User = mongoose.model('User', UserSchema);

// // Define the schema for a single question
// const QuestionSchema = new mongoose.Schema({
//   question: { type: String, required: true },
//   options: { type: [String], required: true, validate: v => Array.isArray(v) && v.length === 4 },
//   correctAnswer: { type: String, required: true }
// }, { _id: false }); // Do not create _id for subdocuments

// // Define the schema for a Test
// const TestSchema = new mongoose.Schema({
//   testId: { type: String, unique: true, required: true }, // Custom test ID
//   adminId: { type: String, required: true }, // This will be the _id of the admin user
//   adminUsername: { type: String, required: true }, // Store admin's username for display
//   topic: { type: String, required: true },
//   numQuestions: { type: Number, required: true },
//   questions: { type: [QuestionSchema], required: true },
//   status: { type: String, required: true, enum: ['created', 'active', 'completed'], default: 'created' },
//   startTime: { type: Date, default: null },
//   participants: [{ // Stores { userId, userName, joinedAt }
//     userId: { type: String, required: true }, // This will be the _id of the user
//     userName: { type: String, required: true }, // User's username
//     joinedAt: { type: Date, default: Date.now }
//   }],
//   createdAt: { type: Date, default: Date.now }
// });

// const Test = mongoose.model('Test', TestSchema);

// // Define the schema for user answers within a result
// const UserAnswerSchema = new mongoose.Schema({
//   questionIndex: { type: Number, required: true },
//   selectedOption: { type: String, required: true },
//   correctAnswer: { type: String, required: true },
//   isCorrect: { type: Boolean, required: true }
// }, { _id: false });

// // Define the schema for a UserResult
// const UserResultSchema = new mongoose.Schema({
//   testId: { type: String, required: true },
//   userId: { type: String, required: true }, // The _id of the user who took the test
//   userName: { type: String, required: true }, // The username of the user who took the test
//   score: { type: Number, required: true },
//   totalQuestions: { type: Number, required: true },
//   answers: { type: [UserAnswerSchema], required: true },
//   submittedAt: { type: Date, default: Date.now }
// });

// // Add a compound unique index to ensure one result per user per test
// UserResultSchema.index({ testId: 1, userId: 1 }, { unique: true });

// const UserResult = mongoose.model('UserResult', UserResultSchema);


// // Initialize Google Gemini API
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// // Initialize Express app
// const app = express();
// const server = http.createServer(app);

// // Configure CORS for Express
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow your frontend origin
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'] // Allow Authorization header
// }));
// app.use(express.json()); // Enable JSON body parsing

// // Configure Socket.IO with CORS
// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//     methods: ['GET', 'POST']
//   }
// });

// // --- JWT Middleware ---
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

//   if (!token) {
//     return res.status(401).json({ message: 'Authentication token required' });
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) {
//       console.error('JWT verification failed:', err);
//       return res.status(403).json({ message: 'Invalid or expired token' });
//     }
//     req.user = user; // Attach user payload (userId, username, role) to request
//     next();
//   });
// };

// const authorizeRole = (roles) => (req, res, next) => {
//   if (!req.user || !req.user.role) {
//     return res.status(403).json({ message: 'Access denied: User role not found' });
//   }
//   if (!roles.includes(req.user.role)) {
//     return res.status(403).json({ message: `Access denied: Requires one of roles: ${roles.join(', ')}` });
//   }
//   next();
// };

// // --- Authentication Endpoints ---

// /**
//  * POST /api/auth/register
//  * Registers a new user.
//  */
// app.post('/api/auth/register', async (req, res) => {
//   const { username, password, role } = req.body; // Role can be specified for admin registration

//   if (!username || !password) {
//     return res.status(400).json({ message: 'Username and password are required' });
//   }

//   try {
//     const userExists = await User.findOne({ username });
//     if (userExists) {
//       return res.status(409).json({ message: 'Username already taken' });
//     }

//     // Default role is 'user'. Only allow 'admin' if a specific secret key is provided
//     // For simplicity in this example, we'll allow client to specify role
//     // In a real app, admin registration would have a separate, protected endpoint or secret key
//     const newUser = new User({ username, password, role: role || 'user' });
//     await newUser.save();

//     res.status(201).json({ message: 'User registered successfully', userId: newUser._id, username: newUser.username, role: newUser.role });
//   } catch (error) {
//     console.error('Error during registration:', error);
//     res.status(500).json({ message: 'Server error during registration', error: error.message });
//   }
// });

// /**
//  * POST /api/auth/login
//  * Logs in a user and returns a JWT token.
//  */
// app.post('/api/auth/login', async (req, res) => {
//   const { username, password } = req.body;

//   if (!username || !password) {
//     return res.status(400).json({ message: 'Username and password are required' });
//   }

//   try {
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid username or password' });
//     }

//     const isMatch = await user.matchPassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid username or password' });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { userId: user._id, username: user.username, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' } // Token expires in 1 hour
//     );

//     res.status(200).json({
//       message: 'Logged in successfully',
//       token,
//       userId: user._id,
//       username: user.username,
//       role: user.role
//     });
//   } catch (error) {
//     console.error('Error during login:', error);
//     res.status(500).json({ message: 'Server error during login', error: error.message });
//   }
// });

// // --- API Endpoints (Protected) ---

// /**
//  * POST /api/tests/create
//  * Creates a new test, generates MCQs using Gemini API, and stores it in MongoDB.
//  * Requires admin role.
//  */
// app.post('/api/tests/create', authenticateToken, authorizeRole(['admin']), async (req, res) => {
//   const { topic, numQuestions } = req.body;
//   const adminId = req.user.userId; // Get adminId from authenticated user
//   const adminUsername = req.user.username; // Get adminUsername from authenticated user

//   if (!topic || !numQuestions) {
//     return res.status(400).json({ message: 'Missing required fields: topic, numQuestions' });
//   }

//   try {
//     console.log(`Generating MCQs for topic: "${topic}" with ${numQuestions} questions...`);
//     const prompt = `Generate ${numQuestions} multiple-choice questions about "${topic}". Each question should have 4 options, and one correct answer. Provide the output as a JSON array of objects, where each object has 'question' (string), 'options' (an array of 4 strings), and 'correctAnswer' (the correct option string, which must be one of the options). Ensure the JSON is valid and only contains the array of question objects.`;

//     const result = await model.generateContent({
//       contents: [{ role: "user", parts: [{ text: prompt }] }],
//       generationConfig: {
//         responseMimeType: "application/json",
//         responseSchema: {
//           type: "ARRAY",
//           items: {
//             type: "OBJECT",
//             properties: {
//               question: { type: "STRING" },
//               options: {
//                 type: "ARRAY",
//                 items: { type: "STRING" },
//                 minItems: 4,
//                 maxItems: 4
//               },
//               correctAnswer: { type: "STRING" }
//             },
//             required: ["question", "options", "correctAnswer"]
//           }
//         }
//       }
//     });

//     const responseText = result.response.candidates[0].content.parts[0].text;
//     const questions = JSON.parse(responseText);

//     // Basic validation for generated questions
//     if (!Array.isArray(questions) || questions.length === 0) {
//       throw new Error('Gemini API did not return a valid array of questions.');
//     }
//     questions.forEach(q => {
//       if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswer || !q.options.includes(q.correctAnswer)) {
//         throw new Error('Generated question format is incorrect.');
//       }
//     });

//     const testId = new mongoose.Types.ObjectId().toString(); // Generate unique test ID
//     const testLink = `${process.env.FRONTEND_URL}/test/${testId}`;

//     const newTest = new Test({
//       testId,
//       adminId,
//       adminUsername,
//       topic,
//       numQuestions: questions.length, // Use actual generated count
//       questions,
//       status: 'created',
//       startTime: null,
//       participants: [],
//       createdAt: new Date()
//     });

//     await newTest.save();
//     console.log(`Test created with ID: ${testId} by admin ${adminUsername}`);
//     res.status(201).json({ message: 'Test created successfully', testId, testLink, questions });

//   } catch (error) {
//     console.error('Error creating test or generating questions:', error);
//     res.status(500).json({ message: 'Failed to create test', error: error.message });
//   }
// });

// /**
//  * GET /api/tests/:testId
//  * Retrieves test details. Accessible to any authenticated user.
//  */
// app.get('/api/tests/:testId', authenticateToken, async (req, res) => {
//   const { testId } = req.params;
//   try {
//     const test = await Test.findOne({ testId });
//     if (!test) {
//       return res.status(404).json({ message: 'Test not found' });
//     }
//     res.status(200).json(test);
//   } catch (error) {
//     console.error('Error fetching test:', error);
//     res.status(500).json({ message: 'Failed to fetch test', error: error.message });
//   }
// });

// /**
//  * POST /api/tests/:testId/join
//  * User joins a test.
//  * Adds user to participants list and emits update via Socket.IO.
//  * Accessible to any authenticated user.
//  */
// app.post('/api/tests/:testId/join', authenticateToken, async (req, res) => {
//   const { testId } = req.params;
//   const userId = req.user.userId; // Get userId from authenticated user
//   const userName = req.user.username; // Get userName from authenticated user

//   try {
//     let test = await Test.findOne({ testId });

//     if (!test) {
//       return res.status(404).json({ message: 'Test not found' });
//     }

//     // Check if user already joined
//     const userAlreadyJoined = test.participants.some(p => p.userId === userId);
//     if (userAlreadyJoined) {
//       return res.status(200).json({ message: 'User already joined', testData: test });
//     }

//     test.participants.push({ userId, userName, joinedAt: new Date() });
//     await test.save();

//     // Emit update to all clients in this test's room (including admin and other users)
//     io.to(testId).emit('testUpdate', { participants: test.participants, status: test.status, startTime: test.startTime ? test.startTime.toISOString() : null });

//     res.status(200).json({ message: 'Joined test successfully', testData: test });

//   } catch (error) {
//     console.error('Error joining test:', error);
//     res.status(500).json({ message: 'Failed to join test', error: error.message });
//   }
// });

// /**
//  * POST /api/tests/:testId/start
//  * Admin starts the test.
//  * Updates test status and start time, emits 'testStarted' via Socket.IO.
//  * Requires admin role and matching adminId.
//  */
// app.post('/api/tests/:testId/start', authenticateToken, authorizeRole(['admin']), async (req, res) => {
//   const { testId } = req.params;
//   const adminId = req.user.userId; // Get adminId from authenticated admin

//   try {
//     const test = await Test.findOne({ testId });

//     if (!test) {
//       return res.status(404).json({ message: 'Test not found' });
//     }

//     if (test.adminId !== adminId) {
//       return res.status(403).json({ message: 'Unauthorized: Only the test admin can start this test.' });
//     }
//     if (test.status !== 'created') {
//       return res.status(400).json({ message: 'Test already started or completed.' });
//     }

//     test.status = 'active';
//     test.startTime = new Date();
//     await test.save();

//     // Emit 'testStarted' event to all clients in this test's room
//     io.to(testId).emit('testStarted', { startTime: test.startTime.toISOString() });
//     console.log(`Test ${testId} started by admin ${adminId} at ${test.startTime}`);

//     res.status(200).json({ message: 'Test started successfully', startTime: test.startTime.toISOString() });

//   } catch (error) {
//     console.error('Error starting test:', error);
//     res.status(500).json({ message: 'Failed to start test', error: error.message });
//   }
// });

// /**
//  * POST /api/tests/:testId/end
//  * Admin ends the test.
//  * Updates test status to 'completed'.
//  * Requires admin role and matching adminId.
//  */
// app.post('/api/tests/:testId/end', authenticateToken, authorizeRole(['admin']), async (req, res) => {
//   const { testId } = req.params;
//   const adminId = req.user.userId;

//   try {
//     const test = await Test.findOne({ testId });

//     if (!test) {
//       return res.status(404).json({ message: 'Test not found' });
//     }

//     if (test.adminId !== adminId) {
//       return res.status(403).json({ message: 'Unauthorized: Only the test admin can end this test.' });
//     }
//     if (test.status !== 'active') {
//       return res.status(400).json({ message: 'Test is not active or already completed.' });
//     }

//     test.status = 'completed';
//     await test.save();

//     io.to(testId).emit('testEnded'); // Notify clients that test has ended
//     console.log(`Test ${testId} ended by admin ${adminId}`);

//     res.status(200).json({ message: 'Test ended successfully' });
//   } catch (error) {
//     console.error('Error ending test:', error);
//     res.status(500).json({ message: 'Failed to end test', error: error.message });
//   }
// });

// /**
//  * POST /api/tests/:testId/submit
//  * User submits their answers.
//  * Calculates score and saves results.
//  * Accessible to any authenticated user.
//  */
// app.post('/api/tests/:testId/submit', authenticateToken, async (req, res) => {
//   const { testId } = req.params;
//   const userId = req.user.userId; // Get userId from authenticated user
//   const userName = req.user.username; // Get userName from authenticated user
//   const { answers } = req.body; // answers is an array of { questionIndex, selectedOption }

//   if (!answers) {
//     return res.status(400).json({ message: 'Missing required field: answers' });
//   }

//   try {
//     const test = await Test.findOne({ testId });
//     if (!test) {
//       return res.status(404).json({ message: 'Test not found' });
//     }

//     const { questions } = test;

//     let score = 0;
//     const userAnswersDetailed = answers.map(userAnswer => {
//       const question = questions[userAnswer.questionIndex];
//       const isCorrect = question && question.correctAnswer === userAnswer.selectedOption;
//       if (isCorrect) {
//         score++;
//       }
//       return {
//         questionIndex: userAnswer.questionIndex,
//         selectedOption: userAnswer.selectedOption,
//         correctAnswer: question ? question.correctAnswer : null,
//         isCorrect
//       };
//     });

//     const userResult = {
//       testId,
//       userId,
//       userName,
//       score,
//       totalQuestions: questions.length,
//       answers: userAnswersDetailed,
//       submittedAt: new Date()
//     };

//     // Use findOneAndUpdate with upsert: true to create or update the result
//     await UserResult.findOneAndUpdate(
//       { testId, userId },
//       { $set: userResult },
//       { upsert: true, new: true, setDefaultsOnInsert: true }
//     );
//     console.log(`User ${userName} (${userId}) submitted test ${testId} with score ${score}`);

//     res.status(200).json({ message: 'Answers submitted successfully', score, totalQuestions: questions.length });

//   } catch (error) {
//     console.error('Error submitting answers:', error);
//     res.status(500).json({ message: 'Failed to submit answers', error: error.message });
//   }
// });

// /**
//  * GET /api/admin/tests
//  * Retrieves all tests created by the authenticated admin.
//  * Requires admin role.
//  */
// app.get('/api/admin/tests', authenticateToken, authorizeRole(['admin']), async (req, res) => {
//   const adminId = req.user.userId; // Get adminId from authenticated admin
//   try {
//     const tests = await Test.find({ adminId }).sort({ createdAt: -1 }); // Sort by createdAt descending
//     res.status(200).json(tests);
//   } catch (error) {
//     console.error('Error fetching admin tests:', error);
//     res.status(500).json({ message: 'Failed to fetch admin tests', error: error.message });
//   }
// });

// /**
//  * GET /api/admin/results/:testId
//  * Retrieves all results for a specific test.
//  * Requires admin role.
//  */
// app.get('/api/admin/results/:testId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
//   const { testId } = req.params;
//   try {
//     const results = await UserResult.find({ testId }).sort({ score: -1 }); // Sort by score descending
//     res.status(200).json(results);
//   } catch (error) {
//     console.error('Error fetching test results:', error);
//     res.status(500).json({ message: 'Failed to fetch test results', error: error.message });
//   }
// });


// // --- Socket.IO Events ---

// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);

//   // Event for users/admins to join a specific test room
//   socket.on('joinTestRoom', async (testId) => {
//     socket.join(testId);
//     console.log(`Socket ${socket.id} joined room ${testId}`);

//     try {
//       const test = await Test.findOne({ testId });
//       if (test) {
//         // Emit current test state to the newly joined client
//         socket.emit('testUpdate', {
//           participants: test.participants,
//           status: test.status,
//           startTime: test.startTime ? test.startTime.toISOString() : null
//         });
//       }
//     } catch (error) {
//       console.error(`Error fetching test data for room ${testId}:`, error);
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// // Start the server
// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
// });
// backend/server.js

// Import necessary modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For JSON Web Tokens
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // Load environment variables from .env file

// --- MongoDB Connection ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/competition_app';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if MongoDB fails to connect
  });

// --- Mongoose Schemas and Models ---

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to hash password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

// Define the schema for a single question
const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true, validate: v => Array.isArray(v) && v.length === 4 },
  correctAnswer: { type: String, required: true }
}, { _id: false }); // Do not create _id for subdocuments

// Define the schema for a Test
const TestSchema = new mongoose.Schema({
  testId: { type: String, unique: true, required: true }, // Custom test ID
  adminId: { type: String, required: true }, // This will be the _id of the admin user
  adminUsername: { type: String, required: true }, // Store admin's username for display
  topic: { type: String, required: true },
  numQuestions: { type: Number, required: true },
  questions: { type: [QuestionSchema], required: true },
  status: { type: String, required: true, enum: ['created', 'active', 'completed'], default: 'created' },
  startTime: { type: Date, default: null },
  duration: { type: Number, required: true }, // New: Duration of the test in minutes
  participants: [{ // Stores { userId, userName, joinedAt }
    userId: { type: String, required: true }, // This will be the _id of the user
    userName: { type: String, required: true }, // User's username
    joinedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Test = mongoose.model('Test', TestSchema);

// Define the schema for user answers within a result
const UserAnswerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selectedOption: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true }
}, { _id: false });

// Define the schema for a UserResult
const UserResultSchema = new mongoose.Schema({
  testId: { type: String, required: true },
  userId: { type: String, required: true }, // The _id of the user who took the test
  userName: { type: String, required: true }, // The username of the user who took the test
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  answers: { type: [UserAnswerSchema], required: true },
  submittedAt: { type: Date, default: Date.now }
});

// Add a compound unique index to ensure one result per user per test
UserResultSchema.index({ testId: 1, userId: 1 }, { unique: true });

const UserResult = mongoose.model('UserResult', UserResultSchema);


// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure CORS for Express
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow your frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow Authorization header
}));
app.use(express.json()); // Enable JSON body parsing

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// --- JWT Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification failed:', err);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // Attach user payload (userId, username, role) to request
    next();
  });
};

const authorizeRole = (roles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: 'Access denied: User role not found' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Access denied: Requires one of roles: ${roles.join(', ')}` });
  }
  next();
};

// --- Authentication Endpoints ---

/**
 * POST /api/auth/register
 * Registers a new user.
 */
app.post('/api/auth/register', async (req, res) => {
  const { username, password, role } = req.body; // Role can be specified for admin registration

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    // Default role is 'user'. Only allow 'admin' if a specific secret key is provided
    // For simplicity in this example, we'll allow client to specify role
    // In a real app, admin registration would have a separate, protected endpoint or secret key
    const newUser = new User({ username, password, role: role || 'user' });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', userId: newUser._id, username: newUser.username, role: newUser.role });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Logs in a user and returns a JWT token.
 */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      userId: user._id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// --- API Endpoints (Protected) ---

/**
 * POST /api/tests/create
 * Creates a new test, generates MCQs using Gemini API, and stores it in MongoDB.
 * Requires admin role.
 */
app.post('/api/tests/create', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { topic, numQuestions, duration } = req.body; // New: Get duration from request body
  const adminId = req.user.userId; // Get adminId from authenticated user
  const adminUsername = req.user.username; // Get adminUsername from authenticated user

  if (!topic || !numQuestions || !duration) { // New: Validate duration
    return res.status(400).json({ message: 'Missing required fields: topic, numQuestions, duration' });
  }
  if (duration <= 0) {
    return res.status(400).json({ message: 'Duration must be a positive number.' });
  }

  try {
    console.log(`Generating MCQs for topic: "${topic}" with ${numQuestions} questions...`);
    const prompt = `Generate ${numQuestions} multiple-choice questions about "${topic}". Each question should have 4 options, and one correct answer. Provide the output as a JSON array of objects, where each object has 'question' (string), 'options' (an array of 4 strings), and 'correctAnswer' (the correct option string, which must be one of the options). Ensure the JSON is valid and only contains the array of question objects.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              options: {
                type: "ARRAY",
                items: { type: "STRING" },
                minItems: 4,
                maxItems: 4
              },
              correctAnswer: { type: "STRING" }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      }
    });

    const responseText = result.response.candidates[0].content.parts[0].text;
    const questions = JSON.parse(responseText);

    // Basic validation for generated questions
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Gemini API did not return a valid array of questions.');
    }
    questions.forEach(q => {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswer || !q.options.includes(q.correctAnswer)) {
        throw new Error('Generated question format is incorrect.');
      }
    });

    const testId = new mongoose.Types.ObjectId().toString(); // Generate unique test ID
    const testLink = `${process.env.FRONTEND_URL}/test/${testId}`;

    const newTest = new Test({
      testId,
      adminId,
      adminUsername,
      topic,
      numQuestions: questions.length, // Use actual generated count
      questions,
      status: 'created',
      startTime: null,
      duration, // New: Save the duration
      participants: [],
      createdAt: new Date()
    });

    await newTest.save();
    console.log(`Test created with ID: ${testId} by admin ${adminUsername}`);
    res.status(201).json({ message: 'Test created successfully', testId, testLink, questions });

  } catch (error) {
    console.error('Error creating test or generating questions:', error);
    res.status(500).json({ message: 'Failed to create test', error: error.message });
  }
});

/**
 * GET /api/tests/:testId
 * Retrieves test details. Accessible to any authenticated user.
 */
app.get('/api/tests/:testId', authenticateToken, async (req, res) => {
  const { testId } = req.params;
  try {
    const test = await Test.findOne({ testId });
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    res.status(200).json(test);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ message: 'Failed to fetch test', error: error.message });
  }
});

/**
 * POST /api/tests/:testId/join
 * User joins a test.
 * Adds user to participants list and emits update via Socket.IO.
 * Accessible to any authenticated user.
 */
app.post('/api/tests/:testId/join', authenticateToken, async (req, res) => {
  const { testId } = req.params;
  const userId = req.user.userId; // Get userId from authenticated user
  const userName = req.user.username; // Get userName from authenticated user

  try {
    let test = await Test.findOne({ testId });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user already joined
    const userAlreadyJoined = test.participants.some(p => p.userId === userId);
    if (userAlreadyJoined) {
      return res.status(200).json({ message: 'User already joined', testData: test });
    }

    test.participants.push({ userId, userName, joinedAt: new Date() });
    await test.save();

    // Emit update to all clients in this test's room (including admin and other users)
    io.to(testId).emit('testUpdate', { participants: test.participants, status: test.status, startTime: test.startTime ? test.startTime.toISOString() : null });

    res.status(200).json({ message: 'Joined test successfully', testData: test });

  } catch (error) {
    console.error('Error joining test:', error);
    res.status(500).json({ message: 'Failed to join test', error: error.message });
  }
});

/**
 * POST /api/tests/:testId/start
 * Admin starts the test.
 * Updates test status and start time, emits 'testStarted' via Socket.IO.
 * Requires admin role and matching adminId.
 */
app.post('/api/tests/:testId/start', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { testId } = req.params;
  const adminId = req.user.userId; // Get adminId from authenticated admin

  try {
    const test = await Test.findOne({ testId });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    if (test.adminId !== adminId) {
      return res.status(403).json({ message: 'Unauthorized: Only the test admin can start this test.' });
    }
    if (test.status !== 'created') {
      return res.status(400).json({ message: 'Test already started or completed.' });
    }

    test.status = 'active';
    test.startTime = new Date();
    await test.save();

    // Emit 'testStarted' event to all clients in this test's room, including duration
    io.to(testId).emit('testStarted', { startTime: test.startTime.toISOString(), duration: test.duration });
    console.log(`Test ${testId} started by admin ${adminId} at ${test.startTime} with duration ${test.duration} minutes`);

    res.status(200).json({ message: 'Test started successfully', startTime: test.startTime.toISOString() });

  } catch (error) {
    console.error('Error starting test:', error);
    res.status(500).json({ message: 'Failed to start test', error: error.message });
  }
});

/**
 * POST /api/tests/:testId/end
 * Admin ends the test.
 * Updates test status to 'completed'.
 * Requires admin role and matching adminId.
 */
app.post('/api/tests/:testId/end', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { testId } = req.params;
  const adminId = req.user.userId;

  try {
    const test = await Test.findOne({ testId });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    if (test.adminId !== adminId) {
      return res.status(403).json({ message: 'Unauthorized: Only the test admin can end this test.' });
    }
    if (test.status !== 'active') {
      return res.status(400).json({ message: 'Test is not active or already completed.' });
    }

    test.status = 'completed';
    await test.save();

    io.to(testId).emit('testEnded'); // Notify clients that test has ended
    console.log(`Test ${testId} ended by admin ${adminId}`);

    res.status(200).json({ message: 'Test ended successfully' });
  } catch (error) {
    console.error('Error ending test:', error);
    res.status(500).json({ message: 'Failed to end test', error: error.message });
  }
});

/**
 * POST /api/tests/:testId/submit
 * User submits their answers.
 * Calculates score and saves results.
 * Accessible to any authenticated user.
 */
app.post('/api/tests/:testId/submit', authenticateToken, async (req, res) => {
  const { testId } = req.params;
  const userId = req.user.userId; // Get userId from authenticated user
  const userName = req.user.username; // Get userName from authenticated user
  const { answers } = req.body; // answers is an array of { questionIndex, selectedOption }

  if (!answers) {
    return res.status(400).json({ message: 'Missing required field: answers' });
  }

  try {
    const test = await Test.findOne({ testId });
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const { questions } = test;

    let score = 0;
    const userAnswersDetailed = answers.map(userAnswer => {
      const question = questions[userAnswer.questionIndex];
      const isCorrect = question && question.correctAnswer === userAnswer.selectedOption;
      if (isCorrect) {
        score++;
      }
      return {
        questionIndex: userAnswer.questionIndex,
        selectedOption: userAnswer.selectedOption,
        correctAnswer: question ? question.correctAnswer : null,
        isCorrect
      };
    });

    const userResult = {
      testId,
      userId,
      userName,
      score,
      totalQuestions: questions.length,
      answers: userAnswersDetailed,
      submittedAt: new Date()
    };

    // Use findOneAndUpdate with upsert: true to create or update the result
    await UserResult.findOneAndUpdate(
      { testId, userId },
      { $set: userResult },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`User ${userName} (${userId}) submitted test ${testId} with score ${score}`);

    res.status(200).json({ message: 'Answers submitted successfully', score, totalQuestions: questions.length });

  } catch (error) {
    console.error('Error submitting answers:', error);
    res.status(500).json({ message: 'Failed to submit answers', error: error.message });
  }
});

/**
 * GET /api/admin/tests
 * Retrieves all tests created by the authenticated admin.
 * Requires admin role.
 */
app.get('/api/admin/tests', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const adminId = req.user.userId; // Get adminId from authenticated admin
  try {
    const tests = await Test.find({ adminId }).sort({ createdAt: -1 }); // Sort by createdAt descending
    res.status(200).json(tests);
  } catch (error) {
    console.error('Error fetching admin tests:', error);
    res.status(500).json({ message: 'Failed to fetch admin tests', error: error.message });
  }
});

/**
 * GET /api/admin/results/:testId
 * Retrieves all results for a specific test.
 * Requires admin role.
 */
app.get('/api/admin/results/:testId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { testId } = req.params;
  try {
    const results = await UserResult.find({ testId }).sort({ score: -1 }); // Sort by score descending
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ message: 'Failed to fetch test results', error: error.message });
  }
});


// --- Socket.IO Events ---

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Event for users/admins to join a specific test room
  socket.on('joinTestRoom', async (testId) => {
    socket.join(testId);
    console.log(`Socket ${socket.id} joined room ${testId}`);

    try {
      const test = await Test.findOne({ testId });
      if (test) {
        // Emit current test state to the newly joined client, including duration
        socket.emit('testUpdate', {
          participants: test.participants,
          status: test.status,
          startTime: test.startTime ? test.startTime.toISOString() : null,
          duration: test.duration // Include duration in testUpdate
        });
      }
    } catch (error) {
      console.error(`Error fetching test data for room ${testId}:`, error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});
