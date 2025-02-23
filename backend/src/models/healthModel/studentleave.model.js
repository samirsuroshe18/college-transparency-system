import mongoose, { Schema, model } from 'mongoose';

const leaveRecordSchema = new Schema({
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  studentName: {
    type: String,
    required: true
  },
  dateOfConcern: {
    type: Date,
    required: true
  },
  timeOfConcern: {
    type: String,
    required: true
  },
  temperature: {
    type: Number,
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  concernDescription: {
    type: String,
    required: true
  },
  previousHistory: {
    type: String
  },
  currentMedications: {
    type: String
  },
  allergies: {
    type: String
  },
  preferredConsultationTime: {
    type: String,
    required: true
  },
  urgencyLevel: {
    type: String,
    enum: ["normal", "urgent"],
    required: true
  },
  attachments: {
    type: String // Assuming you're storing file URLs
  }
});

const LeaveRecord = mongoose.model('LeaveRecord', leaveRecordSchema);

export default LeaveRecord; // Correct ES module export
