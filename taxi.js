const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

// Initialize express app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Static files middleware
app.use(express.static(path.join(__dirname, 'public')));

// Setup view engine
app.set('view engine', 'ejs');

// Connect to MongoDB (replace connection string with your MongoDB connection string)
mongoose.connect('mongodb://localhost:27017/taxiPool', { useNewUrlParser: true, useUnifiedTopology: true });

// Mongoose user schema & model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: { type: String, enum: ['giver', 'receiver'], required: true }
});

const rideSchema = new mongoose.Schema({
    giver: String,
    vehicleType: String,
    startingPoint: String,
    destination: String,
    fare: Number
});

const User = mongoose.model('User', userSchema);
const Ride = mongoose.model('Ride', rideSchema);

// Setup session
app.use(session({
    secret: 'taxi_pool_secret',
    resave: false,
    saveUninitialized: true
}));

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Gateway page (choose between login or register)
app.get('/', (req, res) => {
    res.render('index'); // Render the welcome page with options to login or register
});

// Login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle login form submission
app.post('/login', async (req, res) => {
    const { username, password, userType } = req.body;
    const user = await User.findOne({ username, password, userType });

    if (user) {
        req.session.user = user;
        if (user.userType === 'giver') {
            res.redirect('/giver');
        } else {
            res.redirect('/receiver');
        }
    } else {
        res.send('Invalid username, password, or user type. Please try again.');
    }
});

// Render registration page
app.get('/register', (req, res) => {
    res.render('register'); // Render registration form
});

// Handle registration form submission
app.post('/register', async (req, res) => {
    const { username, password, userType } = req.body;

    // Check if the username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.send('Username already exists. Please choose another.');
    }

    // Create a new user with the selected userType (giver or receiver)
    const newUser = new User({
        username,
        password, // Note: In production, passwords should be hashed!
        userType // This will be either 'giver' or 'receiver'
    });

    await newUser.save(); // Save the new user to the database

    // Redirect to the login page after successful registration
    res.redirect('/login');
});

// Taxi Giver page
app.get('/giver', isAuthenticated, (req, res) => {
    if (req.session.user.userType === 'giver') {
        res.render('taxi-giver');
    } else {
        res.redirect('/');
    }
});

// Handle ride submission by Taxi Giver
app.post('/giver', isAuthenticated, async (req, res) => {
    const { vehicleType, startingPoint, destination, fare } = req.body;
    const ride = new Ride({
        giver: req.session.user.username,
        vehicleType,
        startingPoint,
        destination,
        fare
    });

    await ride.save();
    res.send('Ride successfully added! You can add more rides if you want.');
});

// Taxi Receiver page
app.get('/receiver', isAuthenticated, (req, res) => {
    if (req.session.user.userType === 'receiver') {
        res.render('taxi-receiver');
    } else {
        res.redirect('/');
    }
});

// Handle searching rides by Receiver
app.post('/receiver', isAuthenticated, async (req, res) => {
    const { startingPoint, destination } = req.body;

    // Find rides matching the starting point and destination
    const rides = await Ride.find({ startingPoint, destination });

    // Render the available rides page and pass the list of rides
    res.render('available-rides', { rides });
});

// Handle booking a ride
app.post('/book', isAuthenticated, async (req, res) => {
    const { rideId } = req.body;

    // Find the selected ride by ID
    const ride = await Ride.findById(rideId);

    if (ride) {
        res.send(`Ride from ${ride.startingPoint} to ${ride.destination} successfully booked at a fare of $${ride.fare}.`);
    } else {
        res.send('Ride not found.');
    }
});

// Logout functionality
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
