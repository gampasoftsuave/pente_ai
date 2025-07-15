const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
});

const schema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  
  customerName: {
    type: String,
    required: true,
  },
  customerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    autopopulate: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Open', 'InProgress', 'Closed'],
    default: 'Open',
    required: true,
  },
  resolution: {
    type: String,
    default: '',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  category: {
    type: String,
    default: 'General',
  },
  notes: [noteSchema],
  
  createdBy: { 
    type: mongoose.Schema.ObjectId, 
    ref: 'Admin',
    autopopulate: true 
  },
  assignedTo: { 
    type: mongoose.Schema.ObjectId, 
    ref: 'Admin',
    autopopulate: true 
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

schema.plugin(require('mongoose-autopopulate'));

// Update the updated field before saving
schema.pre('save', function(next) {
  this.updated = Date.now();
  next();
});

// Update the updated field before updating
schema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ updated: Date.now() });
  next();
});

module.exports = mongoose.model('Query', schema);
