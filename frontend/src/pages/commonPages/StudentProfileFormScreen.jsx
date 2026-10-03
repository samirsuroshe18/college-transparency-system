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
import { useNavigate } from "react-router-dom";
import { submitStudentProfile } from "../../api/authApi";
import { errorMessage } from "../../api/client";
import { currentUser } from "../../redux/slices/authSlice";
import { DEPARTMENTS, DIVISIONS, FILE_ACCEPT, FILE_HINT, YEARS, fileProblem } from "../../lib/college";

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
        aria-label={label}
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
        aria-label={label}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a1a1d] text-white border border-amber-500/20 hover:border-amber-500/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#131314] transition-all duration-200"
      >
        {children}
      </select>
    </div>
    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
  </div>
);

// what the server needs before it accepts the form
const REQUIRED = {
  rollNumber: "Roll number is required",
  department: "Department is required",
  classDivision: "Division is required",
  currentYear: "Current year is required",
  phoneNumber: "Phone number is required",
};

const emptyForm = () => ({
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
});

const StudentProfileFormScreen = () => {
  const user = useSelector((state) => state.auth.userData);

  const [formData, setFormData] = useState(emptyForm);
  const [idProof, setIdProof] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
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

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    const problem = fileProblem(file);

    setErrors((prev) => ({ ...prev, idProof: problem }));
    setIdProof(problem ? null : file);
    if (problem) e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const missing = {};
    for (const [field, message] of Object.entries(REQUIRED)) {
      if (!String(formData[field]).trim()) missing[field] = message;
    }
    if (Object.keys(missing).length > 0) {
      setErrors((prev) => ({ ...prev, ...missing }));
      setFormError("Please fill in the fields marked below.");
      return;
    }

    setLoading(true);
    try {
      const res = await submitStudentProfile(formData, idProof);
      dispatch(currentUser(res.data.user));
      navigate("/profile-pending");
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm());
    setIdProof(null);
    setErrors({});
    setFormError("");
  };

  return (
    <div className="min-h-screen bg-[#131314] bg-gradient-to-br from-[#131314] to-[#1a1a1d] text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                <UserPlus className="inline-block" /> Basic Information
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField icon={User} label="Full Name" type="text" name="name" value={user.name} readOnly />
              <InputField icon={Mail} label="Email" type="email" name="email" value={user.email} readOnly />
              <InputField
                icon={Calendar}
                label="Date of Birth"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                error={errors.dateOfBirth}
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
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
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
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                error={errors.rollNumber}
              />
              <SelectField
                icon={School}
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                error={errors.department}
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
              </SelectField>
              <SelectField
                icon={School}
                label="Division"
                name="classDivision"
                value={formData.classDivision}
                onChange={handleChange}
                error={errors.classDivision}
              >
                <option value="">Select Division</option>
                {DIVISIONS.map((division) => <option key={division} value={division}>{division}</option>)}
              </SelectField>
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
                {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
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
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
              />
              <SelectField
                icon={Home}
                label="Accommodation"
                name="hostelStatus"
                value={formData.hostelStatus}
                onChange={handleChange}
                error={errors.hostelStatus}
              >
                <option value="Hostel">Hostel</option>
                <option value="Day Scholar">Day Scholar</option>
              </SelectField>
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-amber-500/80 mb-1.5">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  maxLength={200}
                  className="w-full p-3 rounded-xl bg-[#1a1a1d] text-white border border-amber-500/20 hover:border-amber-500/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#131314] transition-all duration-200"
                  rows="3"
                />
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
              />
              <InputField
                icon={User}
                label="Relation"
                type="text"
                name="emergencyContact.relation"
                value={formData.emergencyContact.relation}
                onChange={handleChange}
              />
              <InputField
                icon={Phone}
                label="Contact Number"
                type="tel"
                name="emergencyContact.contact"
                value={formData.emergencyContact.contact}
                onChange={handleChange}
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
                <label htmlFor="idProof" className="block text-sm font-medium text-amber-500/80 mb-1.5">
                  ID Proof
                </label>

                <input
                  id="idProof"
                  type="file"
                  onChange={handleFileChange}
                  accept={FILE_ACCEPT}
                  className="w-full text-sm text-amber-500/60 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-amber-500 file:text-white hover:file:bg-amber-600 transition-all duration-200"
                />
                {errors.idProof && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.idProof}
                  </p>
                )}
                <p className="text-amber-500/40 text-sm mt-1">{FILE_HINT}</p>
              </div>
            </div>
          </FormSection>

          {formError && (
            <p role="alert" className="text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
            </p>
          )}

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2.5 rounded-xl border border-amber-500/20 text-amber-500 hover:bg-amber-500/10 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#131314] transition-all duration-200"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium hover:from-amber-600 hover:to-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#131314] transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {loading ? "Submitting…" : "Submit Form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfileFormScreen;
