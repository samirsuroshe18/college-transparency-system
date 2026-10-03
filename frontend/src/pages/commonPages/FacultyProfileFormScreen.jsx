import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { submitFacultyProfile } from "../../api/authApi";
import { errorMessage } from "../../api/client";
import { currentUser } from "../../redux/slices/authSlice";
import { DEPARTMENTS, DESIGNATIONS, FILE_ACCEPT, FILE_HINT, fileProblem } from "../../lib/college";

const inputClass = "w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-700";
const labelClass = "block text-sm font-medium mb-1 text-gray-600";

// what the server needs before it accepts the form
const REQUIRED = {
  phoneNumber: "Phone number",
  department: "Department",
  designation: "Designation",
  facultyId: "Faculty ID",
};

const SimpleFacultyForm = () => {
  const user = useSelector((state) => state.auth.userData);

  const [formData, setFormData] = useState({
    phoneNumber: "",
    gender: "",
    dateOfBirth: "",
    department: "",
    designation: "",
    facultyId: "",
    joiningDate: "",
    qualification: "",
    address: "",
    emergencyContact: { name: "", contact: "", relation: "" },
  });
  const [idProof, setIdProof] = useState(null);
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    const problem = fileProblem(file);

    setFileError(problem);
    setIdProof(problem ? null : file);
    if (problem) e.target.value = "";
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
    setFormError("");

    const missing = Object.entries(REQUIRED).filter(([field]) => !formData[field].trim()).map(([, label]) => label);
    if (missing.length > 0) {
      setFormError(`Please fill in: ${missing.join(", ")}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await submitFacultyProfile(formData, idProof);
      dispatch(currentUser(res.data.user));
      navigate("/profile-pending");
    } catch (error) {
      setFormError(errorMessage(error));
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

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Personal Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className={labelClass}>Full Name</label>
                <input id="fullName" type="text" value={user.name} readOnly className={`${inputClass} bg-gray-100`} />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <input id="email" type="email" value={user.email} readOnly className={`${inputClass} bg-gray-100`} />
              </div>

              <div>
                <label htmlFor="phoneNumber" className={labelClass}>Phone Number</label>
                <input id="phoneNumber" type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className={labelClass}>Date of Birth</label>
                <input id="dateOfBirth" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label htmlFor="gender" className={labelClass}>Gender</label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="address" className={labelClass}>Address</label>
                <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows="2" maxLength={200} className={inputClass}></textarea>
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
                <label htmlFor="department" className={labelClass}>Department</label>
                <select id="department" name="department" value={formData.department} onChange={handleChange} className={inputClass}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="designation" className={labelClass}>Designation</label>
                <select id="designation" name="designation" value={formData.designation} onChange={handleChange} className={inputClass}>
                  <option value="">Select Designation</option>
                  {DESIGNATIONS.map((designation) => <option key={designation} value={designation}>{designation}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="facultyId" className={labelClass}>Faculty ID</label>
                <input id="facultyId" type="text" name="facultyId" value={formData.facultyId} onChange={handleChange} className={inputClass} placeholder="e.g., FAC-204" />
              </div>

              <div>
                <label htmlFor="joiningDate" className={labelClass}>Join Date</label>
                <input id="joiningDate" type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className={inputClass} />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="qualification" className={labelClass}>Qualification</label>
                <input id="qualification" type="text" name="qualification" value={formData.qualification} onChange={handleChange} className={inputClass} placeholder="e.g., Ph.D. in Computer Science" />
              </div>
            </div>
          </div>

          {/* ID Proof Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              ID Proof
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <div className="space-y-2">
                <div className="text-gray-600">{idProof ? idProof.name : "Upload an ID proof"}</div>
                <div className="text-gray-500 text-sm">{FILE_HINT}</div>
              </div>
              <input type="file" aria-label="ID proof" accept={FILE_ACCEPT} onChange={handleFileChange} className="w-full mt-2 text-gray-600" />
              {fileError && <p className="text-red-600 text-sm mt-2">{fileError}</p>}
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="contactName" className={labelClass}>Name</label>
                <input id="contactName" type="text" name="name" value={formData.emergencyContact.name} onChange={handleEmergencyContactChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="contactNumber" className={labelClass}>Phone Number</label>
                <input id="contactNumber" type="text" name="contact" value={formData.emergencyContact.contact} onChange={handleEmergencyContactChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="contactRelation" className={labelClass}>Relation</label>
                <input id="contactRelation" type="text" name="relation" value={formData.emergencyContact.relation} onChange={handleEmergencyContactChange} className={inputClass} />
              </div>
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-red-700 bg-red-50 border border-red-200 rounded px-4 py-3 text-sm">{formError}</p>
          )}

          <button
            type="submit"
            className={`w-full flex justify-center items-center gap-2 bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800 transition duration-200 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SimpleFacultyForm;
