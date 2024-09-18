const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login Page
router.get('/', (req, res) => {
    res.render('login');
});

// Handle Login
router.post('/login', async (req, res) => {
    const { username, password, userType } = req.body;
    const user = await User.findOne({ username, password, userType });
    if (user) {
        req.session.user = user;
        if (userType === 'giver') {
            res.redirect('/giver');
        } else {
            res.redirect('/receiver');
        }
    } else {
        res.send('Invalid credentials');
    }
});

module.exports = router;
