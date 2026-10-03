import { useSelector } from "react-redux";
import StudentHealth from "./StudentHealth.jsx";
import DoctorConcerns from "./DoctorConcerns.jsx";
import ClassLeaves from "./ClassLeaves.jsx";

// Health data is private, so each role gets its own page: a student their own concerns,
// the doctor everyone's, a class coordinator the leaves of the class. Nobody else has one.
const HealthPage = () => {
    const user = useSelector((state) => state.auth.userData);

    if (user.role === "student") return <StudentHealth />;
    if (user.role === "doctor") return <DoctorConcerns />;
    if (user.role === "faculty" && user.coordinatorOf?.department) return <ClassLeaves />;

    return (
        <div className="container mx-auto p-4 bg-gray-50 text-gray-900 min-h-screen">
            <h1 className="text-2xl font-bold mb-2">Health and Leave</h1>
            <p className="text-gray-600">Health concerns are private. They are read by the student and the college doctor; a class coordinator sees the leave of the class.</p>
        </div>
    );
};

export default HealthPage;
