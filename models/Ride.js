const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    giver: String,
    vehicleType: String,
    startingPoint: String,
    destination: String,
    fare: Number,
    booked: { type: Boolean, default: false }
});

module.exports = mongoose.model('Ride', rideSchema);

