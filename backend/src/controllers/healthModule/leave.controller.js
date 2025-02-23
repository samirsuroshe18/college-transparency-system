import LeaveRecord from '../../models/healthModel/studentleave.model.js';
import notificationController from './notification.controller.js';

const leaveController = {
  // Create new leave record and trigger notification
 async createLeaveRecord(req, res) {
    try {
      const {
        studentName,
        studentId,
        dateOfConcern,
        timeOfConcern,
        temperature,
        symptoms,
        concernDescription,
        previousHistory,
        currentMedications,
        allergies,
        preferredConsultationTime,
        urgencyLevel
      } = req.body;

      // Handle file upload
      const attachmentUrl = req.file ? req.file.path : null;

       // ✅ Check if required fields are missing
       if (!studentId || !name || !email || !classDivision || !parentEmail || !coordinatorEmail) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields. Ensure all fields are filled."
        });
      }

      // Create a new health record
      const leaveRecord = new LeaveRecord({
        studentName,
        studentId,
        dateOfConcern,
        timeOfConcern,
        temperature,
        symptoms,
        concernDescription,
        previousHistory,
        currentMedications,
        allergies,
        preferredConsultationTime,
        urgencyLevel,
        attachments: attachmentUrl
      });

      await leaveRecord.save();

      // Send notification to coordinator
      await notificationController.sendHealthNotification(leaveRecord._id);

      res.status(201).json({
        success: true,
        data: leaveRecord
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get leave records for a student
  async getStudentLeaveRecords(req, res) {
    try {
      const records = await LeaveRecord.find({ studentId: req.params.studentId });

      res.status(200).json({
        success: true,
        data: records
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

export default leaveController;