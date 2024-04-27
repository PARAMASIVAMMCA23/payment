//server side code:


const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const Razorpay = require('razorpay');

const app = express();
const PORT = 8000;

const razorpay = new Razorpay({
  key_id: 'rzp_test_7Bp9IpbLB7VGtU',
  key_secret: 'U8IEzvGYSHj3Rg86Gsnx1u3r'
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'client')));

app.use(cors());

mongoose.connect('mongodb://localhost:27017/Form', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

const registrationSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: String,
  dob: Date,
  gender: String,
  password: String
});

const Registration = mongoose.model('Registration', registrationSchema);

app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.get('/submit-form', (req, res) => {
  res.send('Registration Page');
});

app.post('/submit-form', (req, res) => {
  const { first_name, last_name, email, dob, gender, password } = req.body;

  const newRegistration = new Registration({
    first_name,
    last_name,
    email,
    dob,
    gender,
    password,
  });

  newRegistration.save().then(() => {
    console.log('Data saved successfully');
    res.redirect('/welcome?action=register');
  }).catch(err => {
    console.error('Error saving form data', err);
    res.status(500).send('Error saving form data');
  });
});

app.get('/welcome', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'welcome.html'));
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Registration.findOne({ email });

    if (!user || user.password !== password) {
      console.log('Invalid email or password');
      return res.status(401).send('Invalid email or password');
    }

    console.log('Login successful for user:', email);
    res.redirect('/welcome?action=login');
  } catch (err) {
    console.error('Error finding user:', err);
    res.status(500).send('Internal server error');
  }
});

app.get('/create-order', (req, res) => {
  res.send('Payment Page');
});

app.post('/create-order', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    
    const amountInPaisa = parseInt(amount) * 100;

    const order = await razorpay.orders.create({
      amount: amountInPaisa, 
      currency: currency,
      receipt: 'order_' + Date.now(),
      payment_capture: 1
    });

    
    const amountInRupees = amountInPaisa / 100;

    res.json({ order_id: order.id, amount_in_rupees: amountInRupees });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Error creating Razorpay order' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
