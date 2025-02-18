import axiosInstance from './config.js';
import { showNotificationWithTimeout } from '../redux/slices/notificationSlice.js';

const createBooking = async (formData, setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.post(
            `/api/v1/booking/create-booking`, // Adjust the endpoint as needed
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

const getBookings = async (setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.get(
            `/api/v1/booking/get-bookings`, // Adjust the endpoint as needed
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({show:true, type:"success", message:response.data.message}));
        return response.data;
    } catch (error) {
        throw error
    }
};

const updateBooking = async (id, setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.put(
            `/api/v1/booking/update/${id}`, 
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({show:true, type:"success", message:response.data.message}));
        return response.data;
    } catch (error) {
        throw error
    }
};

const createFacilities = async (formData, setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.post(
            `/api/v1/facility/create-facilities`, // Adjust the endpoint as needed
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

const getFacilities = async (setLoading, dispatch) => {
    setLoading(true);
    try {
        const response = await axiosInstance.get(
            `/api/v1/facility/get-facilities`,
            { withCredentials: true }
        );
        setLoading(false);
        dispatch(showNotificationWithTimeout({show:true, type:"success", message:response.data.message}));
        return response.data;
    } catch (error) {
        throw error
    }
};


// Multipart Request Example :

// const addTenant = async (formData) => {
//     try {
//         const form = new FormData();
//         console.log('formData:', typeof formData.profile);
//         form.append("name", formData.name);
//         form.append("address", formData.address);
//         form.append("mobile", formData.mobile);
//         form.append("profile", formData.profile);

//         const response = await axiosInstance.post(
//             `/api/v1/tenant/add-tenant`, 
//             form,
//             {
//                 headers: {
//                     "Content-Type": "multipart/form-data",
//                 },
//                 withCredentials: true
//             }
//         );
//         // const response = await axiosInstance.post(
//         //     `/api/v1/tenant/add-tenant`,
//         //     formData,
//         //     {withCredentials: true}
//         // );
//         return response;
//     } catch (error) {
//         console.error('Error while api request:', error);
//         throw error;
//     }
// };

export { createBooking, getBookings, updateBooking, createFacilities, getFacilities }


