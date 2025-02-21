import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ProfileInfoPage = ({ type }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = location.state?.profile || {};
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = () => {
    console.log(`Approved ${type} profile with ID: ${profile.id}`);
    navigate(-1); // Go back after approving
  };

  const handleReject = () => {
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    console.log(`Rejected ${type} profile with ID: ${profile.id}, Reason: ${rejectReason}`);
    setShowRejectDialog(false);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-xl font-bold mb-4">{type === 'student' ? 'Student' : 'Faculty'} Profile Details</h2>
        <div className="space-y-4">
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Department:</strong> {profile.department}</p>
          {type === 'student' ? (
            <>
              <p><strong>Roll Number:</strong> {profile.rollNumber}</p>
              <p><strong>Semester:</strong> {profile.semester}</p>
            </>
          ) : (
            <>
              <p><strong>Designation:</strong> {profile.designation}</p>
              <p><strong>Employee ID:</strong> {profile.employeeId}</p>
            </>
          )}
          <p><strong>Submitted Date:</strong> {profile.submittedDate}</p>
          <p><strong>ID Proof:</strong> <a href={profile.idProof} target="_blank" rel="noopener noreferrer" className="text-blue-500">View ID Proof</a></p>
        </div>
        
        <div className="mt-6 space-x-4">
          <button onClick={handleApprove} className="px-4 py-2 bg-green-600 text-white rounded-lg">Approve</button>
          <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg">Reject</button>
        </div>
      </div>

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-2">Reason for Rejection</h3>
            <textarea
              className="w-full p-2 border rounded-lg"
              placeholder="Enter reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="mt-4 space-x-2">
              <button onClick={confirmReject} className="px-4 py-2 bg-red-600 text-white rounded-lg">Confirm Reject</button>
              <button onClick={() => setShowRejectDialog(false)} className="px-4 py-2 bg-gray-400 text-white rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInfoPage;
