import HealthRecord from '../../models/healthModel/studenthealth.model.js';
import LeaveRecord from '../../models/healthModel/studentleave.model.js';
import notificationController from '../../controllers/healthModule/notification.controller.js';
import { uploadOnCloudinary } from '../../utils/cloudinary.js';

const healthController = {
  // Create new health record and trigger notification
  async createHealthRecord(req, res) {
    try {
      console.log("File : ",req.file);
      if(!req.file){
        throw new Error("File not uploaded");
      }
      const fileUrl = await uploadOnCloudinary(req.file.path);
      const healthRecord = new LeaveRecord({...req.body,attachments:fileUrl?.url});
      await healthRecord.save();

      // Send notification to coordinator
      await notificationController.sendHealthNotification(healthRecord._id);

      res.status(201).json({
        success: true,
        data: healthRecord
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get health records for a student
  async getStudentHealthRecords(req, res) {
    try {
      const records = await LeaveRecord.find({ studentId: req.params.studentId })
        .populate('doctorId', 'name');

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

export default healthController;