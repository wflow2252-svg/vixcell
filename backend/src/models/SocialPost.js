const mongoose = require('mongoose')

const socialPostSchema = new mongoose.Schema({
  platform: { 
    type: String, 
    enum: ['facebook', 'instagram', 'both'],
    required: true 
  },
  contentType: { 
    type: String, 
    enum: ['tech_trend', 'service_showcase', 'case_study'],
    required: true
  },
  text: { type: String, required: true },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video'] },
  metaPostId: { type: String }, // The ID returned from Graph API
  publishedAt: { type: Date },
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  isBoosted: { type: Boolean, default: false },
  boostBudget: { type: Number, default: 0 }
}, { timestamps: true })

module.exports = mongoose.model('SocialPost', socialPostSchema)
