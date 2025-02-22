import React, { useState } from "react";
import { addFacultyProfile } from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { currentUser } from "../../redux/slices/authSlice";
import { showNotificationWithTimeout } from "../../redux/slices/notificationSlice";
import { handleAxiosError } from "../../utils/handleAxiosError";

const SimpleFacultyForm = () => {
  const user = useSelector((state) => state.auth.userData);

  const [formData, setFormData] = useState({
    profilePic: user.profilePic || "",
    fullName: user.name || "",
    email: user.email || "",
    phoneNumber: "",
    gender: "",
    dateOfBirth: "",
    department: "",
    designation: "",
    isBoardMember: false,
    joinDate: "",
    qualification: "",
    address: "",
    idProof: null,
    emergencyContact: { name: "", contact: "", relation: "" },
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        idProof: file,
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    try {
      const res = await addFacultyProfile(formData, setLoading, dispatch);
      dispatch(currentUser(res.data));
      navigate("/profile-pending");
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
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-700">
          Faculty Profile
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Please fill in your professional information
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Personal Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <img
                src={formData.profilePic || "/images/profile.png"}
                alt="Profile Preview"
                className="mx-auto h-32 w-32 object-cover rounded-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="2"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                >
                  <option value="">Select Department</option>
                  <option value="computer-science">Computer Science</option>
                  <option value="electrical">Electrical Engineering</option>
                  <option value="mechanical">Mechanical Engineering</option>
                  <option value="civil">Civil Engineering</option>
                  <option value="chemical">Chemical Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Designation
                </label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                >
                  <option value="">Select Designation</option>
                  <option value="professor">Professor</option>
                  <option value="associate-professor">
                    Associate Professor
                  </option>
                  <option value="assistant-professor">
                    Assistant Professor
                  </option>
                  <option value="lecturer">Lecturer</option>
                  <option value="visiting-faculty">Visiting Faculty</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Join Date
                </label>
                <input
                  type="date"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Qualification
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                  placeholder="e.g., Ph.D. in Computer Science"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isBoardMember"
                    checked={formData.isBoardMember}
                    onChange={handleChange}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-600">
                    Board Member
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Profile Image Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              ID Proof
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mx-auto h-32 w-32 object-cover rounded-full"
                />
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-600">Upload a Id Proof</div>
                  <div className="text-gray-500">PNG, JPG, GIF up to 10MB</div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full mt-2 text-gray-600"
              />
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.emergencyContact.name}
                  onChange={handleEmergencyContactChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.emergencyContact.contact}
                  onChange={handleEmergencyContactChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">
                  Relation
                </label>
                <input
                  type="text"
                  name="relation"
                  value={formData.emergencyContact.relation}
                  onChange={handleEmergencyContactChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full flex justify-center items-center gap-2 bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800 transition duration-200 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SimpleFacultyForm;
