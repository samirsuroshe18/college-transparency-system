import React, { useState } from "react";
import { X, PlusCircle, Search, ClipboardList } from "lucide-react";

const STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "inProgress",
  RESOLVED: "resolved",
  EMERGENCY: "emergency",
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const DoctorDashboard = () => {
  const [concerns, setConcerns] = useState([
    { id: 1, studentName: "John Doe", studentId: "12345", status: STATUS.PENDING },
    { id: 2, studentName: "Jane Smith", studentId: "67890", status: STATUS.RESOLVED },
  ]);

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [emergencyForm, setEmergencyForm] = useState({ studentName: "", studentId: "" });

  const handleEmergencyInputChange = (e) => {
    const { name, value } = e.target;
    setEmergencyForm((prev) => ({ ...prev, [name]: value }));
  };

  const filteredConcerns = concerns.filter(({ studentName, studentId, status }) =>
    (filter === "all" || status === filter) &&
    (studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Doctor Dashboard</h1>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or ID"
          className="border p-2 rounded w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="bg-blue-500 text-white p-2 rounded" onClick={() => setShowEmergencyForm(true)}>
          <PlusCircle size={20} /> Report Emergency
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border rounded">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Student Name</th>
              <th className="p-2">Student ID</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredConcerns.map((concern) => (
              <tr key={concern.id} className="border-t">
                <td className="p-2">{concern.studentName}</td>
                <td className="p-2">{concern.studentId}</td>
                <td className="p-2">{concern.status}</td>
                <td className="p-2">
                  <button
                    className="text-blue-500 underline"
                    onClick={() => {
                      setSelectedConcern(concern);
                      setShowDetailsModal(true);
                    }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEmergencyForm && (
        <Modal title="Report Emergency" onClose={() => setShowEmergencyForm(false)}>
          <input
            name="studentName"
            placeholder="Student Name"
            value={emergencyForm.studentName}
            onChange={handleEmergencyInputChange}
            className="border p-2 rounded w-full mb-2"
          />
          <input
            name="studentId"
            placeholder="Student ID"
            value={emergencyForm.studentId}
            onChange={handleEmergencyInputChange}
            className="border p-2 rounded w-full mb-2"
          />
          <button className="bg-red-500 text-white p-2 rounded w-full">Submit</button>
        </Modal>
      )}

      {showDetailsModal && selectedConcern && (
        <Modal title="Concern Details" onClose={() => setShowDetailsModal(false)}>
          <p><strong>Name:</strong> {selectedConcern.studentName}</p>
          <p><strong>ID:</strong> {selectedConcern.studentId}</p>
          <p><strong>Status:</strong> {selectedConcern.status}</p>
        </Modal>
      )}
    </div>
  );
};

export default DoctorDashboard;
