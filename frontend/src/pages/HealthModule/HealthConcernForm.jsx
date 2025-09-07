import React, { useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  Heart,
  History,
  Send,
  ThermometerSun,
  User,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

const FormSection = ({ title, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-200 space-y-4 mb-6 hover:border-blue-300 transition-all duration-300">
    <h2 className="text-xl font-semibold text-blue-700 border-b border-blue-200 pb-2 flex items-center gap-2">
      {title}
    </h2>
    {children}
  </div>
);

const InputField = ({ icon: Icon, label, error, ...props }) => (
  <div className="relative">
    <label className="block text-sm font-medium text-blue-700 mb-1.5">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-blue-400 group-hover:text-blue-500 transition-colors duration-200" />
      </div>
      <input
        {...props}
        className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200
          ${
            props.readOnly
              ? "bg-gray-50 text-gray-500 cursor-not-allowed border border-gray-200"
              : "bg-white text-gray-900 border border-blue-200 hover:border-blue-300 focus:border-blue-500"
          }`}
      />
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const HealthConcernForm = () => {
  const user = useSelector((state) => state.auth.userData);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    studentName: user?.name || "",
    studentId: user?.rollNumber || "1",
    dateOfConcern: "",
    timeOfConcern: "",
    temperature: "",
    symptoms: "",
    concernDescription: "",
    previousHistory: "",
    currentMedications: "",
    allergies: "",
    preferredConsultationTime: "",
    urgencyLevel: "normal",
    attachments: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        setErrors((prev) => ({
          ...prev,
          attachments: "File size should be less than 5MB",
        }));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        attachments: file, // Ensure it's properly stored
      }));
      setErrors((prev) => ({ ...prev, attachments: "" }));
    } else {
      setFormData((prev) => ({
        ...prev,
        attachments: null, // Ensure it's not undefined
      }));
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const form = new FormData();
  
      // Ensure file exists before appending
      if (formData.attachments) {
        form.append("attachments", formData.attachments);
      }
  
      form.append("studentName", formData.studentName);
      form.append("studentId", formData.studentId || "");
      form.append("dateOfConcern", formData.dateOfConcern);
      form.append("timeOfConcern", formData.timeOfConcern);
      form.append("temperature", formData.temperature);
      form.append("symptoms", formData.symptoms);
      form.append("concernDescription", formData.concernDescription);
      form.append("previousHistory", formData.previousHistory || "");
      form.append("currentMedications", formData.currentMedications || "");
      form.append("allergies", formData.allergies || "");
      form.append(
        "preferredConsultationTime",
        formData.preferredConsultationTime
      );
      form.append("urgencyLevel", formData.urgencyLevel || "normal");
  
      console.log("Final FormData:", formData);
      
      const response = await axios.post(
        `${import.meta.env.VITE_DOMAIN}/api/v1/healthleave/health/create`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );
  
      alert("Health concern submitted successfully!");
  
      setFormData({
        studentName: user?.name || "",
        studentId: user?.rollNumber || "1",
        dateOfConcern: "",
        timeOfConcern: "",
        temperature: "",
        symptoms: "",
        concernDescription: "",
        previousHistory: "",
        currentMedications: "",
        allergies: "",
        preferredConsultationTime: "",
        urgencyLevel: "normal",
        attachments: null,
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting health concern. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-600">
              Health Concern Form
            </h1>
            <p className="text-blue-600/80 mt-3 text-lg">
              Submit your health concerns to the medical team
            </p>
          </div>

          {/* Student Information */}
          <FormSection
            title={
              <>
                <User className="inline-block" /> Student Information
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                icon={User}
                label="Student Name"
                type="text"
                name="studentName"
                value={formData.studentName}
                readOnly
              />
              <InputField
                icon={User}
                label="Student ID"
                type="text"
                name="studentId"
                value={formData.studentId}
                readOnly
              />
            </div>
          </FormSection>

          {/* Concern Details */}
          <FormSection
            title={
              <>
                <Heart className="inline-block" /> Concern Details
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                icon={Calendar}
                label="Date of Concern"
                type="date"
                name="dateOfConcern"
                value={formData.dateOfConcern}
                onChange={handleChange}
                required
              />
              <InputField
                icon={Clock}
                label="Time of Concern"
                type="time"
                name="timeOfConcern"
                value={formData.timeOfConcern}
                onChange={handleChange}
                required
              />
              <InputField
                icon={ThermometerSun}
                label="Temperature (°F)"
                type="number"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                step="0.1"
                placeholder="98.6"
              />
              <InputField
                icon={AlertCircle}
                label="Primary Symptoms"
                type="text"
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                required
                placeholder="e.g., Headache, Fever"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-blue-700 mb-1.5">
                Detailed Description of Concern
              </label>
              <textarea
                name="concernDescription"
                value={formData.concernDescription}
                onChange={handleChange}
                required
                rows="4"
                className="w-full p-3 rounded-xl bg-white text-gray-900 border border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                placeholder="Please describe your health concern in detail..."
              />
            </div>
          </FormSection>

          {/* Medical History */}
          <FormSection
            title={
              <>
                <History className="inline-block" /> Medical History
              </>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1.5">
                  Previous Related Health Issues
                </label>
                <textarea
                  name="previousHistory"
                  value={formData.previousHistory}
                  onChange={handleChange}
                  rows="2"
                  className="w-full p-3 rounded-xl bg-white text-gray-900 border border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  placeholder="Any relevant medical history..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  icon={FileText}
                  label="Current Medications"
                  type="text"
                  name="currentMedications"
                  value={formData.currentMedications}
                  onChange={handleChange}
                  placeholder="List any current medications"
                />
                <InputField
                  icon={AlertCircle}
                  label="Allergies"
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="List any allergies"
                />
              </div>
            </div>
          </FormSection>

          {/* Consultation Preferences */}
          <FormSection
            title={
              <>
                <Clock className="inline-block" /> Consultation Preferences
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                icon={Clock}
                label="Preferred Consultation Time"
                type="time"
                name="preferredConsultationTime"
                value={formData.preferredConsultationTime}
                onChange={handleChange}
              />

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1.5">
                  Urgency Level
                </label>
                <select
                  name="urgencyLevel"
                  value={formData.urgencyLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-gray-900 border border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <option value="low">Low - Can wait a few days</option>
                  <option value="normal">
                    Normal - Need consultation within 24 hours
                  </option>
                  <option value="urgent">
                    Urgent - Need immediate attention
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-blue-700 mb-1.5">
                Supporting Documents (Optional)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full text-sm text-blue-600/80 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-all duration-200"
              />
              {errors.attachments && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.attachments}
                </p>
              )}
              <p className="text-blue-600/60 text-sm mt-1">
                Upload any relevant medical reports or documents (Max 5MB)
              </p>
            </div>
          </FormSection>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  dateOfConcern: "",
                  timeOfConcern: "",
                  temperature: "",
                  symptoms: "",
                  concernDescription: "",
                  previousHistory: "",
                  currentMedications: "",
                  allergies: "",
                  preferredConsultationTime: "",
                  urgencyLevel: "normal",
                  attachments: null,
                }))
              }
              className="px-6 py-2.5 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? "Submitting..." : "Submit Concern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealthConcernForm;
