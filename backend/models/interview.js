// Interview model
const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  // Add interview schema fields here
}, {
  timestamps: true
});

module.exports = mongoose.model('Interview', interviewSchema);
