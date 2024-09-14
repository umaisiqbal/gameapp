const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your_jwt_secret'; // Change this to your secret key

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/game-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error: ', err));

// Register a new user
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    highScore: 0,
  });

  try {
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);  // Log the error
    res.status(500).json({ error: 'User registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  res.json({ token, username: user.username, highScore: user.highScore });
});

// Fetch user high score
app.get('/api/scores/:username', async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ highScore: user.highScore });
});

// Update user high score
app.post('/api/scores/:username', async (req, res) => {
  const { username } = req.params;
  const { highScore } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.highScore = Math.max(user.highScore, highScore); // Update only if it's a new high score
  await user.save();
  res.json({ message: 'High score updated successfully', highScore: user.highScore });
});

// Reset user high score to 0
// Reset user high score to 0
app.post('/api/scores/:username/reset', async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.highScore = 0; // Reset the high score
  await user.save();
  
  // Send the updated highScore in the response
  res.json({ message: 'High score reset successfully', highScore: user.highScore });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
