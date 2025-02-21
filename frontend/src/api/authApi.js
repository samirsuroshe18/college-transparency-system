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
        dispatch(showNotificationWithTimeout({show:true, type:"success", message:response.data.message}));
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
        dispatch(showNotificationWithTimeout({show:true, type:"success", message:response.data.message}));
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
            {withCredentials: true}
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({show:true, type:"success", message:response.data.message}));
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
        dispatch(showNotificationWithTimeout({show:true, type:"success", message:response.data.message}));
        return response.data;
    } catch (error) {
        throw error
    }
};

const addStudentProfile = async (formData, setLoading, dispatch) => {
    setLoading(true);
    try {
        const form = new FormData();

        form.append("proofImage", formData.proofImage);
        form.append("fullName", formData.fullName);
        form.append("email", formData.email);
        form.append("studentId", formData.studentId);
        form.append("department", formData.department);
        form.append("year", formData.year);

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
        dispatch(showNotificationWithTimeout({show:true, type:"success", message:response.data.message}));
        return response;
    } catch (error) {
        throw error
    }
};

const addFacultyProfile = async (formData, setLoading, dispatch) => {
    setLoading(true);
    try {
        const form = new FormData();
        console.log("payload Data",formData)
        console.log("payload Image",formData.image)
        form.append("proofImage", formData.image);
        form.append("fullName", formData.fullName);
        form.append("email", formData.email);
        form.append("employeeId", formData.employeeId);
        form.append("department", formData.department);
        form.append("designation", formData.designation);

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
        dispatch(showNotificationWithTimeout({show:true, type:"success", message:response.data.message}));
        return response;
    } catch (error) {
        throw error
    }
};

export { googleLoginUser, logoutUser, getCurrentUser, loginUser, addFacultyProfile, addStudentProfile }


