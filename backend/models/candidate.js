// Candidate model
import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  name: { 
    type:String,
    required: true
  },
  email: {
    type: String,
    required: true, 
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
  },
  resume_data: {
    type: String,
    required: true
  },
  scores: {
    type: Map,
    of: Number
  },
  
}, {
  timestamps: true
});

export default mongoose.model('Candidate', candidateSchema);
