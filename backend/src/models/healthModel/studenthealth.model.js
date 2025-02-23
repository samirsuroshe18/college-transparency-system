import { Schema, model } from 'mongoose';

const studentSchema = new Schema({
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  parentEmail: {
    type: String,
    required: true
  },
  coordinatorEmail: {
    type: String,
    required: true
  }
});

export default model('Student', studentSchema);