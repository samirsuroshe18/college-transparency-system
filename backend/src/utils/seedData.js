import Student from "../models/Student Model/student.model.js";

const seedData = async () => {
    await Student.deleteMany();
    let students = [];
    for (let i = 1; i <= 80; i++) {
        students.push({
            name: `Student ${i}`,
            rollno: `A${i < 10 ? "0" + i : i}`,
            department: "Computer Engineering",
            studentId: `24102A20${i < 10 ? "0" + i : i}`,
            address: `Address ${i}`,
            mobileNo: `98765432${(i % 10)}${(i % 10)}`,
            parentMobileNo: `91234567${(i % 10)}${(i % 10)}`,
            email: `student${i}@college.edu`,
            bloodGroup: ["A+", "B+", "O+", "AB+"][i % 4],
            dob: new Date(`200${i % 10}-0${(i % 9) + 1}-1${i % 9}`),
            admissionYear: 2024,
            passingYear: 2028,
            division: "A",
            currentSemester: 2,
            hostelResident: i % 2 === 0,
            emergencyContact: {
                name: `Parent ${i}`,
                relation: "Father",
                contactNo: `91234567${(i % 10)}${(i % 10)}`
            },
            studentStatus: "Active",
            admissionType: "Regular",
            previousSchool: `School ${i}`,
            profilePicture: `https://example.com/profile${i}.jpg`
        });
    }
    await Student.insertMany(students);
    console.log("80 Students Seeded Successfully!");
};

export default seedData;