const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/flavorcrate', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  phone: String,
  address: String,
  password: String
});

const menuItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  isVeg: Boolean,
  image: String,
  rating: String,
  description: String
});

const orderSchema = new mongoose.Schema({
  userEmail: String,
  items: Array,
  total: Number,
  status: String,
  timestamp: String
});

const User = mongoose.model('User', userSchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const Order = mongoose.model('Order', orderSchema);


// Signup
app.post('/api/signup', async (req, res) => {
  const { email } = req.body;
  if (await User.findOne({ email })) return res.status(409).json({ message: 'Email exists' });

  const user = new User(req.body);
  await user.save();
  res.status(201).json(user);
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  res.json(user);
});

// Get all menu items
app.get('/api/menu', async (req, res) => {
  const items = await MenuItem.find();
  res.json(items);
});

// Place order
app.post('/api/orders', async (req, res) => {
  const order = new Order(req.body);
  await order.save();
  res.status(201).json(order);
});

// Get orders by user
app.get('/api/orders/:email', async (req, res) => {
  const orders = await Order.find({ userEmail: req.params.email });
  res.json(orders);
});
