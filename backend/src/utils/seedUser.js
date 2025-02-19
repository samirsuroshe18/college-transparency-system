import mongoose from "mongoose";
import { User } from "../models/user.model.js"; // Adjust the path based on your project structure
import dotenv from "dotenv";

dotenv.config();

const seedUsers = async () => {
    try {


        const users = [
            {
                name: "Tanishq Kulkarni",
                email: "tanishqkulkarni18@gmail.com",
                isGoogleVerified: true,
                role: "student",
                studentId: "STU12345",
                rollno: "2021001",
                department: "Computer Engineering",
                address: "Pune, India",
                mobileNo: "9876543210",
                parentMobileNo: "9876543211",
                bloodGroup: "B+",
                dob: new Date("2003-05-10"),
                admissionYear: 2021,
                passingYear: 2025,
                division: "A",
                currentSemester: 6,
                hostelResident: false,
                emergencyContact: {
                    name: "Raj Kulkarni",
                    relation: "Father",
                    contactNo: "9876543212"
                },
                studentStatus: "Active",
                admissionType: "Regular",
                previousSchool: "XYZ High School"
            },
            {
                name: "Mohit Dhangar",
                email: "mohit.dhangar88@gmail.com",
                isGoogleVerified: true,
                role: "student",
                studentId: "STU12346",
                rollno: "2021002",
                department: "Information Technology",
                address: "Mumbai, India",
                mobileNo: "9876543213",
                parentMobileNo: "9876543214",
                bloodGroup: "O+",
                dob: new Date("2002-08-15"),
                admissionYear: 2021,
                passingYear: 2025,
                division: "B",
                currentSemester: 6,
                hostelResident: true,
                emergencyContact: {
                    name: "Suresh Dhangar",
                    relation: "Father",
                    contactNo: "9876543215"
                },
                studentStatus: "Active",
                admissionType: "Direct",
                previousSchool: "ABC High School"
            },
            {
                name: "Admin User",
                email: "admin@example.com",
                isGoogleVerified: false,
                role: "admin",
                studentId: null,
                rollno: null,
                department: null,
                address: "Office, India",
                mobileNo: "9876543220",
                parentMobileNo: null,
                bloodGroup: "A+",
                dob: new Date("1990-01-01"),
                admissionYear: null,
                passingYear: null,
                division: null,
                currentSemester: null,
                hostelResident: false,
                emergencyContact: {
                    name: "Office Contact",
                    relation: "Manager",
                    contactNo: "9876543221"
                },
                studentStatus: null,
                admissionType: null,
                previousSchool: null
            }
        ];

        // await User.deleteMany({ email: { $in: users.map(user => user.email) } }); // Remove existing users with same emails
        await User.insertMany(users);

        console.log("Users seeded successfully!");
        mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding users:", error);
        mongoose.connection.close();
        process.exit(1);
    }
};

seedUsers();