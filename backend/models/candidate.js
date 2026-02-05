// Candidate model
const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  // Add candidate schema fields here
}, {
  timestamps: true
});

module.exports = mongoose.model('Candidate', candidateSchema);
