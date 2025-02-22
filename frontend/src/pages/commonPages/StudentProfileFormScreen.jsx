import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  School,
  Calendar,
  Home,
  Heart,
  FileText,
  Upload,
  BookOpen,
  GraduationCap,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addStudentProfile } from "../../api/authApi";
import { currentUser } from "../../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { showNotificationWithTimeout } from "../../redux/slices/notificationSlice";
import { handleAxiosError } from "../../utils/handleAxiosError";

const FormSection = ({ title, children }) => (
  <div className="bg-[#1a1a1d]/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-amber-500/10 space-y-4 mb-6 hover:border-amber-500/20 transition-all duration-300">
    <h2 className="text-xl font-semibold text-amber-500 border-b border-amber-500/20 pb-2 flex items-center gap-2">
      {title}
    </h2>
    {children}
  </div>
);

const InputField = ({ icon: Icon, label, error, ...props }) => (
  <div className="relative">
    <label className="block text-sm font-medium text-amber-500/80 mb-1.5">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-amber-500/50 group-hover:text-amber-500 transition-colors duration-200" />
      </div>
      <input
        {...props}
        className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#131314] transition-all duration-200 ${
          props.readOnly
            ? "bg-[#1a1a1d] text-gray-400 cursor-not-allowed border border-gray-700"
            : "bg-[#1a1a1d] text-white border border-amber-500/20 hover:border-amber-500/40 focus:border-amber-500"
        }`}
      />
    </div>
    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
  </div>
);

const SelectField = ({ icon: Icon, label, children, error, ...props }) => (
  <div className="relative">
    <label className="block text-sm font-medium text-amber-500/80 mb-1.5">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-amber-500/50 group-hover:text-amber-500 transition-colors duration-200" />
      </div>
      <select
        {...props}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a1a1d] text-white border border-amber-500/20 hover:border-amber-500/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#131314] transition-all duration-200"
      >
        {children}
      </select>
    </div>
    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
  </div>
);

const StudentProfileFormScreen = () => {
  const user = useSelector((state) => state.auth.userData);

  const [formData, setFormData] = useState({
    name: user.name || "John Doe",
    email: user.email || "john.doe@example.com",
    profilePic: user.profilePic || null,
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    rollNumber: "",
    department: "",
    classDivision: "",
    admissionType: "regular",
    admissionDate: "",
    currentYear: "",
    passingYear: "",
    hostelStatus: "Hostel",
    address: "",
    emergencyContact: { name: "", relation: "", contact: "" },
    bloodGroup: "",
    idProof: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        setErrors((prev) => ({
          ...prev,
          [field]: "File size should be less than 5MB",
        }));
        return;
      }
      setFormData((prev) => ({ ...prev, [field]: file }));
      if (field === "profilePic") {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      }
      // Clear error when valid file is uploaded
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    try {
      const res = await addStudentProfile(formData, setLoading, dispatch);
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
    <div className="min-h-screen bg-[#131314] bg-gradient-to-br from-[#131314] to-[#1a1a1d] text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
              Student Profile Form
            </h1>
            <p className="text-amber-500/60 mt-3 text-lg">
              Complete your academic profile
            </p>
          </div>

          <FormSection
            title={
              <>
                <User className="inline-block" /> Profile Picture
              </>
            }
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative group flex justify-center">
                <img
                  src={formData.profilePic}
                  alt="Profile Preview"
                  className="w-32 h-32 rounded-2xl border-2 border-amber-500/50 object-cover transition-all duration-300 group-hover:border-amber-500"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title={
              <>
                <UserPlus className="inline-block" /> Basic Information
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                icon={User}
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                readOnly
              />
              <InputField
                icon={Mail}
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                readOnly
              />
              <InputField
                icon={Calendar}
                label="Date of Birth"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                error={errors.dob}
              />
              <SelectField
                icon={User}
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                error={errors.gender}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </SelectField>
            </div>
          </FormSection>

          <FormSection
            title={
              <>
                <GraduationCap className="inline-block" /> Academic Details
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                icon={BookOpen}
                label="Roll Number"
                type="text"
                name="rollNo"
                value={formData.rollNo}
                onChange={handleChange}
                error={errors.rollNo}
              />
              <InputField
                icon={School}
                label="Department"
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                error={errors.department}
              />
              <InputField
                icon={School}
                label="Division"
                type="text"
                name="division"
                value={formData.division}
                onChange={handleChange}
                error={errors.division}
              />
              <SelectField
                icon={School}
                label="Admission Type"
                name="admissionType"
                value={formData.admissionType}
                onChange={handleChange}
                error={errors.admissionType}
              >
                <option value="regular">Regular</option>
                <option value="lateral">Lateral</option>
              </SelectField>
              <InputField
                icon={Calendar}
                label="Admission Date"
                type="date"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleChange}
                error={errors.admissionDate}
              />
              <InputField
                icon={Calendar}
                label="Passing year"
                type="text"
                name="passingYear"
                value={formData.passingYear}
                onChange={handleChange}
                error={errors.passingYear}
              />
              <SelectField
                icon={User}
                label="Current Year"
                name="currentYear"
                value={formData.currentYear}
                onChange={handleChange}
                error={errors.currentYear}
              >
                <option value="">Select Year</option>
                <option value="FE">FE</option>
                <option value="SE">SE</option>
                <option value="TE">TE</option>
                <option value="BE">BE</option>
              </SelectField>
            </div>
          </FormSection>

          <FormSection
            title={
              <>
                <Phone className="inline-block" /> Contact Information
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                icon={Phone}
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
              />
              <SelectField
                icon={Home}
                label="Accommodation"
                name="hostelStatus"
                value={formData.hostelStatus}
                onChange={handleChange}
                error={errors.hostelStatus}
              >
                <option value="hostel">Hostel</option>
                <option value="day_scholar">Day Scholar</option>
              </SelectField>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-amber-500/80 mb-1.5">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-[#1a1a1d] text-white border border-amber-500/20 hover:border-amber-500/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#131314] transition-all duration-200"
                  rows="3"
                />
                {errors.address && (
                  <p className="text-red-400 text-sm mt-1">{errors.address}</p>
                )}
              </div>
            </div>
          </FormSection>

          <FormSection
            title={
              <>
                <AlertCircle className="inline-block" /> Emergency Contact
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField
                icon={User}
                label="Contact Name"
                type="text"
                name="emergencyContact.name"
                value={formData.emergencyContact.name}
                onChange={handleChange}
                error={errors["emergencyContact.name"]}
              />
              <InputField
                icon={User}
                label="Relation"
                type="text"
                name="emergencyContact.relation"
                value={formData.emergencyContact.relation}
                onChange={handleChange}
                error={errors["emergencyContact.relation"]}
              />
              <InputField
                icon={Phone}
                label="Contact Number"
                type="tel"
                name="emergencyContact.contact"
                value={formData.emergencyContact.contact}
                onChange={handleChange}
                error={errors["emergencyContact.contact"]}
              />
            </div>
          </FormSection>

          <FormSection
            title={
              <>
                <FileText className="inline-block" /> Additional Information
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectField
                icon={Heart}
                label="Blood Group"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                error={errors.bloodGroup}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </SelectField>
              <div>
                <label className="block text-sm font-medium text-amber-500/80 mb-1.5">
                  ID Proof
                </label>

                <input
                  type="file"
                  onChange={(e) => handleImageChange(e, "idProof")}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full text-sm text-amber-500/60 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-amber-500 file:text-white hover:file:bg-amber-600 transition-all duration-200"
                />
                {errors.idProof && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.idProof}
                  </p>
                )}
                <p className="text-amber-500/40 text-sm mt-1">
                  Accepted formats: PDF, JPG, PNG (Max 5MB)
                </p>
              </div>
            </div>
          </FormSection>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() =>
                setFormData({
                  name: "John Doe",
                  email: "john.doe@example.com",
                  profilePic: null,
                  dateOfBirth: "",
                  gender: "",
                  phoneNumber: "",
                  rollNumber: "",
                  department: "",
                  division: "",
                  admissionType: "regular",
                  admissionDate: "",
                  currentYear: "",
                  passingYear: "",
                  hostelStatus: "hostel",
                  address: "",
                  emergencyContact: { name: "", relation: "", contact: "" },
                  bloodGroup: "",
                  idProof: null,
                })
              }
              className="px-6 py-2.5 rounded-xl border border-amber-500/20 text-amber-500 hover:bg-amber-500/10 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#131314] transition-all duration-200"
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium hover:from-amber-600 hover:to-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#131314] transition-all duration-200 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Submit Form
            </button>
          </div>
        </form>

        {/* Success Modal - Can be implemented if needed */}
        {/* <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[#1a1a1d] p-6 rounded-2xl shadow-xl border border-amber-500/10 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-amber-500">Success!</h3>
            <p className="text-gray-300 mt-2">Your form has been submitted successfully.</p>
            <button className="mt-4 w-full px-4 py-2 bg-amber-500 text-white rounded-xl">
              Close
            </button>
          </div>
        </div>  */}
      </div>
    </div>
  );
};

export default StudentProfileFormScreen;
