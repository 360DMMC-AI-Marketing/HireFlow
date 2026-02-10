// Interview model
import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  // Add interview schema fields here
}, {
  timestamps: true
});

export default mongoose.model('Interview', interviewSchema);
