import mongoose from "mongoose";

const CheatingReportSchema = new mongoose.Schema({
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    name: {
        type: String,
        
    },
    
    rollNo: {
        type: String,
        
    },
    department: {
        type: String,
        enum: ["Computer", "IT", "EXTC", "Civil", "Mechanical"],
       
    },
    class: {
        type: String,
        enum: ["FE", "SE", "TE", "BE"],
        
    },
    reason: {
        type: String,
       
    },
    proof: {
        type: String,
       
    },
}, {timestamps: true,});

const CheatingReport = mongoose.model("CheatingReport", CheatingReportSchema);
export default CheatingReport;
