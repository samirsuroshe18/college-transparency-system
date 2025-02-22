import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud } from 'lucide-react';

const StudentComplaintPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [content, setContent] = useState('');
  const [proof, setProof] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);
  const fetchComplaints = async () => {
    try {
      const res = await axios.get('/complaints');
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching complaints', err);
      setComplaints([]); // Fallback to empty array
    }
  };

  const handleSubmit = async () => {
    if (!content) return alert('Content is required');

    const formData = new FormData();
    formData.append('content', content);
    if (proof) formData.append('proof_url', proof);
    formData.append('is_anonymous', isAnonymous);

    try {
      await axios.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Complaint submitted');
      setContent('');
      setProof(null);
      setIsAnonymous(true);
      fetchComplaints();
    } catch (err) {
      console.error('Error submitting complaint', err);
      alert('Error submitting complaint');
    }
  };
  {
    Array.isArray(complaints) && complaints.length === 0 ? (
      <p>No approved complaints yet.</p>
    ) : (
    complaints.map((complaint) => (
      <Card key={complaint._id}>
        <CardContent>
          <p className="mb-2">{complaint.content}</p>
          {complaint.proof_url && (
            <img
              src={complaint.proof_url}
              alt="Proof"
              className="w-full max-w-md rounded-lg"
            />
          )}
          <p className="text-sm text-gray-500 mt-2">
            Status: {complaint.status}
          </p>
        </CardContent>
      </Card>
    ))
  )
  }


  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Anonymous Complaint Portal</h1>

      <Card className="mb-6">
        <CardContent>
          <h2 className="text-xl font-semibold mb-2">Submit a Complaint</h2>
          <Textarea
            placeholder="Describe your complaint..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mb-4"
          />
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <UploadCloud />
              <span>Upload Proof (optional)</span>
              <Input type="file" onChange={(e) => setProof(e.target.files[0])} className="hidden" />
            </label>
            {proof && <p className="text-sm text-gray-600">Selected: {proof.name}</p>}
          </div>
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <Input
                type="checkbox"
                checked={isAnonymous}
                onChange={() => setIsAnonymous(!isAnonymous)}
              />
              Submit Anonymously
            </label>
          </div>
          <Button onClick={handleSubmit}>Submit Complaint</Button>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-semibold mb-4">Approved Complaints</h2>
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <p>No approved complaints yet.</p>
        ) : (
          complaints.map((complaint) => (
            <Card key={complaint._id}>
              <CardContent>
                <p className="mb-2">{complaint.content}</p>
                {complaint.proof_url && (
                  <img
                    src={complaint.proof_url}
                    alt="Proof"
                    className="w-full max-w-md rounded-lg"
                  />
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Status: {complaint.status}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentComplaintPage;
