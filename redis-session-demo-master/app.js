const crypto = require('crypto');
globalThis.crypto = crypto.webcrypto;
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const uuid = require('uuid/v4');
const session = require('express-session');
const redis = require('redis');
const redisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/User');
const indexRouter = require('./routes/index');

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/beerapp')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// Kết nối Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis error:', err));

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  genid: (req) => uuid(),
  store: new redisStore({ client: redisClient }),
  name: '_redisDemo',
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  cookie: { secure: false, maxAge: 3600000 }, // 1 giờ
  saveUninitialized: false
}));

// Middleware kiểm tra login
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
}

// GET login
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { error: null });
});

// POST login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    req.session.user = user.username;
    res.redirect('/');
  } catch (err) {
    res.render('login', { error: 'Something went wrong' });
  }
});

// GET register
app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('register', { error: null });
});

// POST register
app.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match' });
  }
  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.render('register', { error: 'Username already exists' });
    }
    const user = new User({ username, password });
    await user.save();
    req.session.user = user.username;
    res.redirect('/');
  } catch (err) {
    console.log('Register error:', err); // thêm dòng này
    res.render('register', { error: 'Something went wrong' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Trang chính — cần login
app.use('/', requireLogin, indexRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;