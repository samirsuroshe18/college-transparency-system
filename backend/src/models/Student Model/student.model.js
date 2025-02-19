import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollno: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    mobileNo: { type: String, required: true },
    parentMobileNo: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bloodGroup: { type: String, required: true },
    dob: { type: Date, required: true },
    admissionYear: { type: Number, required: true },
    passingYear: { type: Number, required: true },
    division: { type: String, required: true },
    currentSemester: { type: Number, required: true },
    hostelResident: { type: Boolean, default: false },
    emergencyContact: {
        name: { type: String, required: true },
        relation: { type: String, required: true },
        contactNo: { type: String, required: true }
    },
    studentStatus: { type: String, enum: ["Active", "Alumni"], required: true },
    admissionType: { type: String, enum: ["Regular", "Direct"], required: true },
    previousSchool: { type: String, required: true },
    profilePicture: { type: String },
}, { timestamps: true });
const Student = mongoose.model("Student", studentSchema);

export default Student;