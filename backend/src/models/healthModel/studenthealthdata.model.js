const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  diagnosis: {
    type: String,
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  reportedDate: {
    type: Date,
    default: Date.now
  },
  recommendedLeave: {
    type: Number, // number of days
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  notificationSent: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);