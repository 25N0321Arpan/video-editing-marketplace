require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const { initDB } = require('./config/database');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Authenticate all requests (sets res.locals.user if logged in)
app.use(authenticate);

// Routes
app.use('/', require('./routes/auth'));
app.use('/jobs', require('./routes/jobs'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/admin', require('./routes/admin'));
app.use('/submissions', require('./routes/submissions'));
app.use('/profile', require('./routes/profile'));

// Home page
app.get('/', (req, res) => {
  try {
    const { getAllJobs } = require('./models/Job');
    const { getAllUsers } = require('./models/User');
    const { getPlatformRevenue } = require('./models/Transaction');

    const featuredJobs = getAllJobs({ status: 'open' }).slice(0, 6);
    const allUsers = getAllUsers();
    const editors = allUsers.filter(u => u.role === 'editor' || u.role === 'both');
    const allJobs = getAllJobs();
    const revenue = getPlatformRevenue();

    res.render('home', {
      title: 'VideoMarket - Video Editing Marketplace',
      featuredJobs,
      stats: {
        totalJobs: allJobs.length,
        totalEditors: editors.length,
        totalPaidOut: revenue
      }
    });
  } catch (err) {
    console.error(err);
    res.render('home', {
      title: 'VideoMarket - Video Editing Marketplace',
      featuredJobs: [],
      stats: { totalJobs: 0, totalEditors: 0, totalPaidOut: 0 }
    });
  }
});

// About page
app.get('/about', (req, res) => {
  res.render('about', { title: 'About VideoMarket' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('home', {
    title: 'Page Not Found',
    featuredJobs: [],
    stats: { totalJobs: 0, totalEditors: 0, totalPaidOut: 0 },
    error: 'Page not found.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('home', {
    title: 'Error',
    featuredJobs: [],
    stats: { totalJobs: 0, totalEditors: 0, totalPaidOut: 0 },
    error: 'An internal server error occurred.'
  });
});

// Initialize database then start server
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VideoMarket server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
