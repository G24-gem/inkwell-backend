const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const articleRoutes = require('./routes/articleRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Inkwell API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
