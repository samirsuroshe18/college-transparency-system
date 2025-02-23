import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle } from "lucide-react";

const CheatingReports = () => {
    const [name, setName] = useState("");
    const [rollNo, setRollNo] = useState("");
    const [department, setDepartment] = useState("Computer");
    const [studentClass, setStudentClass] = useState("FE");
    const [reason, setReason] = useState("");
    const [proof, setProof] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [complaints, setComplaints] = useState([]);
    const [activeTab, setActiveTab] = useState("submit");

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_DOMAIN}/api/v1/cheating/get-cheating`, { withCredentials: true });
            setComplaints(res.data);
        } catch (error) {
            console.error("Error fetching complaints:", error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size <= 5 * 1024 * 1024) {
            setProof(file);
            setPreview(URL.createObjectURL(file));
        } else {
            alert("File size must be less than 5MB.");
        }
    };

    const submitReport = async () => {
        if (!name || !rollNo || !reason || !proof) {
            alert("Please fill all fields and upload proof!");
            return;
        }
        setIsLoading(true);
        const formData = new FormData();
        formData.append("name", name);
        formData.append("rollNo", rollNo);
        formData.append("department", department);
        formData.append("studentClass", studentClass);
        formData.append("reason", reason);
        formData.append("proof", proof);

        try {
            await axios.post(`${import.meta.env.VITE_DOMAIN}/api/v1/cheating/add-cheating`, formData, { withCredentials: true });
            alert("Report submitted successfully!");
            setName("");
            setRollNo("");
            setReason("");
            setProof(null);
            setPreview(null);
            fetchComplaints();
        } catch (error) {
            alert("Error submitting report.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-3xl mx-auto">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center text-gray-800">
                            Academic Integrity Report System
                        </CardTitle>
                        <div className="flex justify-center gap-4 mt-4">
                            <Button
                                variant={activeTab === "submit" ? "default" : "outline"}
                                onClick={() => setActiveTab("submit")}
                                className="w-40"
                            >
                                Submit Report
                            </Button>
                            <Button
                                variant={activeTab === "view" ? "default" : "outline"}
                                onClick={() => setActiveTab("view")}
                                className="w-40"
                            >
                                View Reports
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {activeTab === "submit" ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        type="text"
                                        placeholder="Student Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-white"
                                    />
                                    <Input
                                        type="text"
                                        placeholder="Roll Number"
                                        value={rollNo}
                                        onChange={(e) => setRollNo(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select value={department} onValueChange={setDepartment}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["Computer", "IT", "EXTC", "Civil", "Mechanical"].map((dept) => (
                                                <SelectItem key={dept} value={dept}>
                                                    {dept}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={studentClass} onValueChange={setStudentClass}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["FE", "SE", "TE", "BE"].map((cls) => (
                                                <SelectItem key={cls} value={cls}>
                                                    {cls}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Textarea
                                    placeholder="Describe the incident in detail..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="min-h-32 bg-white"
                                />
                                <div className="space-y-4">
                                    <label className="block">
                                        <div className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-400 focus:outline-none">
                                            <div className="flex flex-col items-center space-y-2">
                                                <Upload className="w-8 h-8 text-gray-400" />
                                                <span className="text-sm text-gray-500">
                                                    Upload proof (max 5MB)
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </div>
                                    </label>
                                    {preview && (
                                        <img
                                            src={preview}
                                            alt="Proof Preview"
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                    )}
                                </div>
                                <Button
                                    onClick={submitReport}
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? "Submitting..." : "Submit Report"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {complaints.length === 0 ? (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            No reports have been submitted yet.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="space-y-4">
                                        {complaints.map((complaint, index) => (
                                            <Card key={index} className="overflow-hidden">
                                                <CardContent className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-800">
                                                                {complaint.name}
                                                            </h3>
                                                            <p className="text-sm text-gray-500">
                                                                Roll No: {complaint.rollNo}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                                {complaint.department} - {complaint.studentClass}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-600 mb-4">{complaint.reason}</p>
                                                    {complaint.proof && (
                                                        <img
                                                            src={complaint.proof}
                                                            alt="Proof"
                                                            className="w-full h-48 object-cover rounded-lg"
                                                        />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CheatingReports;