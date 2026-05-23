'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const demoRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
      default: () => uuidv4(),
      index: true,
    },
    // Visitor info
    visitor: {
      name: { type: String, required: true, trim: true },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      phone: { type: String, default: null, trim: true },
      ip: { type: String, default: null },
    },
    // Business info submitted by visitor
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [150, 'Business name too long'],
    },
    businessType: {
      type: String,
      required: [true, 'Business type is required'],
      enum: [
        'restaurant',
        'clinic',
        'store',
        'gym',
        'hotel',
        'salon',
        'pharmacy',
        'law_firm',
        'real_estate',
        'school',
        'cafe',
        'photography',
        'travel',
        'fitness',
        'tech',
        'other',
      ],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description too long'],
    },
    primaryColor: {
      type: String,
      default: '#6366f1', // default indigo
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'],
    },
    language: {
      type: String,
      enum: ['en', 'ar', 'fr'],
      default: 'en',
    },
    // Generated website HTML
    generatedHtml: {
      type: String,
      required: true,
    },
    // Processing metadata
    generationTime: {
      type: Number, // milliseconds
      default: null,
    },
    templateUsed: {
      type: String,
      default: null,
    },
    // Admin review
    status: {
      type: String,
      enum: ['new', 'viewed', 'contacted', 'converted', 'dismissed'],
      default: 'new',
      index: true,
    },
    viewedAt: {
      type: Date,
      default: null,
    },
    viewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminNote: {
      type: String,
      default: null,
      maxlength: [2000, 'Admin note too long'],
    },
    // How many times the demo page was accessed
    previewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────
demoRequestSchema.index({ status: 1, createdAt: -1 });
demoRequestSchema.index({ 'visitor.email': 1 });
demoRequestSchema.index({ businessType: 1 });

const DemoRequest = mongoose.model('DemoRequest', demoRequestSchema);

module.exports = DemoRequest;
