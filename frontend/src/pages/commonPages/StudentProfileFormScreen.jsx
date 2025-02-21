import React, { useState } from 'react';
import { addStudentProfile } from '../../api/authApi';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { currentUser } from '../../redux/slices/authSlice';
import { showNotificationWithTimeout } from '../../redux/slices/notificationSlice';
import { handleAxiosError } from '../../utils/handleAxiosError';

const SimpleStudentForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    department: '',
    year: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    try {
      const res = await addStudentProfile(formData, setLoading, dispatch);
      dispatch(currentUser(res.data));
      if(res.data.data.profileStatus === "Pending") {
        navigate("/profile-pending");
      } else {
        navigate("/");
      }
      navigate("/");
    } catch (error) {
      setLoading(false);
      dispatch(
        showNotificationWithTimeout({
          show: true,
          type: "error",
          message: handleAxiosError(error),
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-center mb-2">Student Profile</h2>
        <p className="text-gray-500 text-center mb-6">Please fill in your academic information</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="your.email@example.com"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Student ID</label>
              <input
                type="text"
                name="studentId"
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter your student ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select
                name="department"
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select department</option>
                <option value="computer-science">Computer Science</option>
                <option value="electrical">Electrical Engineering</option>
                <option value="mechanical">Mechanical Engineering</option>
                <option value="civil">Civil Engineering</option>
                <option value="chemical">Chemical Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select
                name="year"
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select year</option>
                <option value="1">First Year</option>
                <option value="2">Second Year</option>
                <option value="3">Third Year</option>
                <option value="4">Fourth Year</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Proof Document</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="mx-auto h-32 w-auto object-cover rounded" />
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-600">Upload a file or drag and drop</div>
                  <div className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full mt-2"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  ); 
};

export default SimpleStudentForm;