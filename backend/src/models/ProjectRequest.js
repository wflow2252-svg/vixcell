'use strict';

const mongoose = require('mongoose');

const projectRequestSchema = new mongoose.Schema(
  {
    // Client info
    client: {
      name: {
        type: String,
        required: [true, 'Client name is required'],
        trim: true,
        maxlength: 150,
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
      },
      phone: { type: String, default: null, trim: true },
      company: { type: String, default: null, trim: true },
      country: { type: String, default: null },
    },
    // Project details
    projectTitle: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [200, 'Project title too long'],
    },
    projectType: {
      type: String,
      enum: [
        'website',
        'mobile_app',
        'web_app',
        'e_commerce',
        'dashboard',
        'api_backend',
        'design_only',
        'consultation',
        'other',
      ],
      required: [true, 'Project type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description too long'],
    },
    budget: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      currency: { type: String, default: 'USD' },
    },
    timeline: {
      type: String,
      enum: ['asap', '1_month', '2_3_months', '3_6_months', 'flexible'],
      default: 'flexible',
    },
    // References or inspirations
    references: [{ type: String }],
    // Attachments (brief, wireframes, etc.)
    attachments: [
      {
        url: String,
        filename: String,
        mimeType: String,
      },
    ],
    // Admin workflow
    status: {
      type: String,
      enum: [
        'new',
        'reviewing',
        'proposal_sent',
        'negotiating',
        'accepted',
        'rejected',
        'completed',
        'cancelled',
      ],
      default: 'new',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminNotes: {
      type: String,
      default: null,
      maxlength: [5000, 'Admin notes too long'],
    },
    proposalSentAt: { type: Date, default: null },
    // Source tracking
    source: {
      type: String,
      enum: ['contact_form', 'chat', 'email', 'referral', 'demo_followup', 'other'],
      default: 'contact_form',
    },
    // If this came from a demo request
    linkedDemoRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DemoRequest',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────
projectRequestSchema.index({ status: 1, priority: -1, createdAt: -1 });
projectRequestSchema.index({ 'client.email': 1 });
projectRequestSchema.index({ assignedAdmin: 1, status: 1 });

const ProjectRequest = mongoose.model('ProjectRequest', projectRequestSchema);

module.exports = ProjectRequest;
