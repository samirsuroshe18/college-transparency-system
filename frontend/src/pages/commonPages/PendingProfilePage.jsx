import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { approveProfile, getApprovedFaculty, getPendingProfiles, rejectProfile, setDuties } from "../../api/authApi";
import { errorMessage } from "../../api/client";
import { showNotificationWithTimeout } from "../../redux/slices/notificationSlice";
import { DEPARTMENTS, DIVISIONS, YEARS } from "../../lib/college";

const TABS = [
  { key: "faculty", label: "Faculty Profiles" },
  { key: "student", label: "Student Profiles" },
  { key: "duties", label: "Faculty Duties" },
];

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "Not provided");

const Detail = ({ label, children, wide = false }) => (
  <div className={wide ? "col-span-2" : ""}>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-gray-700 break-words">{children || "Not provided"}</p>
  </div>
);

const CloseIcon = () => (
  <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
    <path d="M6 18L18 6M6 6l12 12"></path>
  </svg>
);

// One approved faculty member with the duties an admin can give
const DutiesRow = ({ member, onSave }) => {
  const [isBoardMember, setIsBoardMember] = useState(Boolean(member.isBoardMember));
  const [coordinator, setCoordinator] = useState({
    department: member.coordinatorOf?.department || "",
    year: member.coordinatorOf?.year || "",
    division: member.coordinatorOf?.division || "",
  });
  const [saving, setSaving] = useState(false);

  const chosen = [coordinator.department, coordinator.year, coordinator.division].filter(Boolean).length;
  // a class needs all three parts, or none
  const incomplete = chosen > 0 && chosen < 3;

  const update = (field) => (e) => setCoordinator((current) => ({ ...current, [field]: e.target.value }));

  const save = async () => {
    setSaving(true);
    await onSave(member._id, { isBoardMember, coordinatorOf: chosen === 3 ? coordinator : null });
    setSaving(false);
  };

  const selectClass = "p-2 border rounded text-gray-700 text-sm";

  return (
    <tr className="hover:bg-gray-50 align-top">
      <td className="px-6 py-4 text-sm text-gray-700">
        <span className="font-medium">{member.name}</span>
        <span className="block text-gray-500">{member.designation} · {member.department}</span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-700">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isBoardMember} onChange={(e) => setIsBoardMember(e.target.checked)} />
          Board member
        </label>
      </td>
      <td className="px-6 py-4 text-sm text-gray-700">
        <div className="flex flex-wrap gap-2">
          <select aria-label="Department" className={selectClass} value={coordinator.department} onChange={update("department")}>
            <option value="">No class</option>
            {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
          <select aria-label="Year" className={selectClass} value={coordinator.year} onChange={update("year")}>
            <option value="">Year</option>
            {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
          <select aria-label="Division" className={selectClass} value={coordinator.division} onChange={update("division")}>
            <option value="">Division</option>
            {DIVISIONS.map((division) => <option key={division} value={division}>{division}</option>)}
          </select>
        </div>
        {incomplete && <p className="text-red-600 text-xs mt-1">Choose department, year and division, or clear all three.</p>}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={save}
          disabled={saving || incomplete}
          className="px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </td>
    </tr>
  );
};

const PendingProfilesPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("faculty");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [profiles, setProfiles] = useState({ student: [], faculty: [] });
  const [approvedFaculty, setApprovedFaculty] = useState([]);
  const dispatch = useDispatch();

  const say = useCallback((type, message) => {
    dispatch(showNotificationWithTimeout({ show: true, type, message }));
  }, [dispatch]);

  const load = useCallback(async () => {
    try {
      const [pending, faculty] = await Promise.all([getPendingProfiles(), getApprovedFaculty()]);
      setProfiles({ student: pending.data.students, faculty: pending.data.faculty });
      setApprovedFaculty(faculty.data.faculty);
    } catch (error) {
      say("error", errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [say]);

  useEffect(() => {
    load();
  }, [load]);

  const closeDialogs = () => {
    setSelectedProfile(null);
    setIsRejectDialogOpen(false);
    setRejectionReason("");
  };

  const decide = async (request) => {
    setDeciding(true);
    try {
      const res = await request();
      say("success", res.message);
      closeDialogs();
      await load();
    } catch (error) {
      say("error", errorMessage(error));
    } finally {
      setDeciding(false);
    }
  };

  const onApprove = (id) => decide(() => approveProfile(id));
  const onReject = (id, reason) => decide(() => rejectProfile(id, reason));

  const saveDuties = async (id, duties) => {
    try {
      const res = await setDuties(id, duties);
      say("success", res.message);
      await load();
    } catch (error) {
      say("error", errorMessage(error));
    }
  };

  const currentProfiles = profiles[activeTab] || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-700 mb-2">
          Pending Profile Approvals
        </h1>
        <p className="text-gray-500 mb-6">
          Review and approve pending profile requests, and give duties to faculty
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg ${
                activeTab === tab.key
                  ? "bg-gray-700 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              {tab.key !== "duties" && ` (${profiles[tab.key].length})`}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-500">Loading…</p>}

        {/* Main Table */}
        {!loading && activeTab !== "duties" && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === "student" ? "Roll Number" : "Designation"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProfiles.map((profile) => (
                  <tr key={profile._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.designation || profile.rollNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedProfile(profile)}
                        className="text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1 rounded-full"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {currentProfiles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No profiles are waiting for a decision.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Duties of approved faculty */}
        {!loading && activeTab === "duties" && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Board</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinator of class</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedFaculty.map((member) => <DutiesRow key={member._id} member={member} onSave={saveDuties} />)}
                {approvedFaculty.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No approved faculty yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Dialog */}
        {selectedProfile && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  {selectedProfile.role === "student" ? "Student Profile" : "Faculty Profile"}
                </h3>
                <button onClick={closeDialogs} aria-label="Close" className="text-gray-500 hover:text-gray-700">
                  <CloseIcon />
                </button>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-3xl font-semibold">
                  {selectedProfile.name?.charAt(0)?.toUpperCase()}
                </div>
                {selectedProfile.idProof ? (
                  <a href={selectedProfile.idProof} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm text-blue-600 hover:underline">
                    View ID proof
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No ID proof attached</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-3 pb-2 border-b">Personal Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Detail label="Full Name">{selectedProfile.name}</Detail>
                    <Detail label="Email">{selectedProfile.email}</Detail>
                    <Detail label="Phone Number">{selectedProfile.phoneNumber}</Detail>
                    <Detail label="Date of Birth">{formatDate(selectedProfile.dateOfBirth)}</Detail>
                    <Detail label="Gender">{selectedProfile.gender}</Detail>
                    {selectedProfile.role === "student" && <Detail label="Blood Group">{selectedProfile.bloodGroup}</Detail>}
                    <Detail label="Address" wide>{selectedProfile.address}</Detail>
                  </div>
                </div>

                {selectedProfile.role === "student" && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-700 mb-3 pb-2 border-b">Academic Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Detail label="Department">{selectedProfile.department}</Detail>
                      <Detail label="Year">{selectedProfile.currentYear}</Detail>
                      <Detail label="Division">{selectedProfile.classDivision}</Detail>
                      <Detail label="Roll Number">{selectedProfile.rollNumber}</Detail>
                      <Detail label="Admission Type">{selectedProfile.admissionType}</Detail>
                      <Detail label="Admission Date">{formatDate(selectedProfile.admissionDate)}</Detail>
                      <Detail label="Passing Year">{selectedProfile.passingYear}</Detail>
                      <Detail label="Hostel Status">{selectedProfile.hostelStatus}</Detail>
                    </div>
                  </div>
                )}

                {selectedProfile.role === "faculty" && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-700 mb-3 pb-2 border-b">Professional Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Detail label="Department">{selectedProfile.department}</Detail>
                      <Detail label="Designation">{selectedProfile.designation}</Detail>
                      <Detail label="Faculty ID">{selectedProfile.facultyId}</Detail>
                      <Detail label="Qualification">{selectedProfile.qualification}</Detail>
                      <Detail label="Joining Date">{formatDate(selectedProfile.joiningDate)}</Detail>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-3 pb-2 border-b">Emergency Contact</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Detail label="Name">{selectedProfile.emergencyContact?.name}</Detail>
                    <Detail label="Relation">{selectedProfile.emergencyContact?.relation}</Detail>
                    <Detail label="Contact">{selectedProfile.emergencyContact?.contact}</Detail>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button onClick={closeDialogs} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Close
                </button>
                <button onClick={() => setIsRejectDialogOpen(true)} disabled={deciding} className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50">
                  Reject
                </button>
                <button onClick={() => onApprove(selectedProfile._id)} disabled={deciding} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">
                  Approve Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason Dialog */}
        {isRejectDialogOpen && selectedProfile && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-[60] p-4">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Rejection Reason</h3>
                <button
                  onClick={() => { setIsRejectDialogOpen(false); setRejectionReason(""); }}
                  aria-label="Close"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="mb-4">
                <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-600 mb-2">
                  Please provide a reason for rejection
                </label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-700 placeholder-gray-400"
                  rows="4"
                  placeholder="Enter the reason for rejection..."
                ></textarea>
                <p className="mt-1 text-sm text-gray-500">
                  This reason is shown to the person, who can then submit the profile again.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { setIsRejectDialogOpen(false); setRejectionReason(""); }}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onReject(selectedProfile._id, rejectionReason)}
                  disabled={!rejectionReason.trim() || deciding}
                  className={`px-4 py-2 bg-red-600 text-white rounded-lg ${
                    rejectionReason.trim() && !deciding
                      ? "hover:bg-red-700"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingProfilesPage;
