const mongoose = require('mongoose')

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  companyName: { type: String },
  serviceInterestedIn: { type: String },
  source: { 
    type: String, 
    enum: ['facebook', 'instagram', 'website_form', 'chat'],
    required: true 
  },
  aiSummary: { type: String }, // Summary of what the client wants based on their chat/comment
  metaCommentId: { type: String },
  metaSenderId: { type: String },
  status: { 
    type: String, 
    enum: ['new', 'contacted', 'qualified', 'lost', 'won'],
    default: 'new'
  }
}, { timestamps: true })

module.exports = mongoose.model('Lead', leadSchema)
