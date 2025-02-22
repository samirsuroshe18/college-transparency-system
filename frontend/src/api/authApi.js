import { showNotificationWithTimeout } from '../redux/slices/notificationSlice.js';
import axiosInstance from './config.js';


const googleLoginUser = async (token, setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.post(
            `/api/v1/user/google-login`,
            {
                name: token.name,
                email: token.email,
                profilePic: token.picture,
            },
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({ show: true, type: "success", message: response.data.message }));
        return response.data;
    } catch (error) {
        throw error;
    }
};


const logoutUser = async (setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.get(
            `/api/v1/tenant/logout`,
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({ show: true, type: "success", message: response.data.message }));
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getCurrentUser = async (setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.get(
            `/api/v1/user/current-user`,
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({ show: true, type: "success", message: response.data.message }));
        return response.data;
    } catch (error) {
        throw error
    }
};

const loginUser = async (formData, setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.post(
            `/api/v1/user/login`,
            formData,
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({ show: true, type: "success", message: response.data.message }));
        return response.data;
    } catch (error) {
        throw error
    }
};

const addStudentProfile = async (formData, setLoading, dispatch) => {
    setLoading(true);
    try {
        const form = new FormData();
        console.log("payload Image", formData.idProof);

        form.append("proofImage", formData.idProof);
        form.append("name", formData.name);
        form.append("email", formData.email);
        form.append("studentId", formData.studentId || ""); // Ensure it's not undefined
        form.append("department", formData.department);
        form.append("classDivision", formData.division || "");
        form.append("rollNumber", formData.rollNo);
        form.append("admissionType", formData.admissionType);
        form.append("admissionDate", formData.admissionDate);
        form.append("currentYear", formData.currentYear);
        form.append("passingYear", formData.passingYear || "");
        form.append("hostelStatus", formData.hostelStatus);
        form.append("address", formData.address);
        form.append("bloodGroup", formData.bloodGroup || "");
        form.append("emergencyContact", JSON.stringify(formData.emergencyContact) || "");

        // Additional fields from original payload
        form.append("dateOfBirth", formData.dob);
        form.append("gender", formData.gender);
        form.append("phoneNumber", formData.phone);

        const response = await axiosInstance.post(
            `/api/v1/user/add-student-profile`,
            form,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                withCredentials: true
            }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({ show: true, type: "success", message: response.data.message }));
        return response.data;
    } catch (error) {
        throw error
    }
};

const addFacultyProfile = async (formData, setLoading, dispatch) => {
    setLoading(true);
    console.log("payload Data", formData)
    console.log("Qualification", formData.qualification)
    try {
        const form = new FormData();
        console.log("payload Data", formData)
        console.log("payload Image", formData.idProof);
        form.append("proofImage", formData.idProof);
        form.append("phoneNumber", formData.phoneNumber);
        form.append("gender", formData.gender);
        form.append("designation", formData.designation);
        form.append("dateOfBirth", formData.dateOfBirth);
        form.append("department", formData.department);
        form.append("isBoardMember", formData.isBoardMember);
        form.append("joinDate", formData.joinDate);
        form.append("address", formData.address);
        form.append("qualification", formData.qualification);
        form.append("emergencyContact", JSON.stringify(formData.emergencyContact));

        const response = await axiosInstance.post(
            `/api/v1/user/add-faculty-profile`,
            form,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                withCredentials: true
            }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({ show: true, type: "success", message: response.data.message }));
        return response.data;
    } catch (error) {
        throw error
    }
};

const getPendingStudents = async (setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.get(
            `/api/v1/user/get-pending-students`,
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({ show: true, type: "success", message: response.data.message }));
        return response.data;
    } catch (error) {
        throw error
    }
};

const getPendingFaculty = async (setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.get(
            `/api/v1/user/get-pending-faculty`,
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({ show: true, type: "success", message: response.data.message }));
        return response.data;
    } catch (error) {
        throw error
    }
};

const approveStudent = async (data, setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.post(
            `/api/v1/user/student-approve`,
            data,
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({ show: true, type: "success", message: response.data.message }));
        return response.data;
    } catch (error) {
        throw error
    }
};

const rejectStudent = async (data, setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.post(
            `/api/v1/user/student-reject`,
            data,
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({ show: true, type: "success", message: response.data.message }));
        return response.data;
    } catch (error) {
        throw error
    }
};

const approveFaculty = async (data, setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.post(
            `/api/v1/user/faculty-approve`,
            data,
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({ show: true, type: "success", message: response.data.message }));
        return response.data;
    } catch (error) {
        throw error
    }
};

const rejectFaculty = async (data, setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.get(
            `/api/v1/user/faculty-reject`,
            data,
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({ show: true, type: "success", message: response.data.message }));
        return response.data;
    } catch (error) {
        throw error
    }
};

export {
    googleLoginUser,
    logoutUser,
    getCurrentUser,
    loginUser,
    addFacultyProfile,
    addStudentProfile,
    getPendingStudents,
    getPendingFaculty,
    approveStudent,
    rejectStudent,
}


