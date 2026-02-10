import mongoose from "mongoose";
import job from "./job";
const applicationSchema = new mongoose.Schema({
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true,
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true
        }   
        
    },  
    track_status: {
        type: String,
        enum: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'],  
        default: 'Applied'
    },
});

module.exports = mongoose.model('Application', applicationSchema);