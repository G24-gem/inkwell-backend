const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// REGISTER
async function register(req, res) {
  const { email, password, username } = req.body;

  // Basic validation
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  try {
    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Check if username already exists
    const existingUsername = await pool.query(
      'SELECT id FROM profiles WHERE username = $1',
      [username]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert into users table
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    );

    const userId = newUser.rows[0].id;

    // Insert into profiles table
    await pool.query(
      'INSERT INTO profiles (id, username) VALUES ($1, $2)',
      [userId, username]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: userId, email, username }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong during registration' });
  }
}

// LOGIN
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user by email
    const result = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get username from profiles
    const profile = await pool.query(
      'SELECT username FROM profiles WHERE id = $1',
      [user.id]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: profile.rows[0]?.username
      }
    });

  } catch (err) {
    console.log('LOGIN ERROR:', err.message);
    res.status(500).json({ error: 'Something went wrong during login' });
  }
}
module.exports = { register, login };
