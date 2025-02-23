
import Student from '../../models/healthModel/studenthealth.model.js';
import HealthRecord from '../../models/healthModel/studenthealth.model.js';
import LeaveRecord from '../../models/healthModel/studentleave.model.js';
import nodemailer from 'nodemailer';

// Configure nodemailer
const transporter = nodemailer.createTransport({
  // Add your email service configuration here
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const notificationController = {
  // Send health notification to class coordinator
  async sendHealthNotification(healthRecordId) {
    try {
      const healthRecord = await HealthRecord.findById(healthRecordId)
        .populate('studentId');

      if (!healthRecord || healthRecord.notificationSent) {
        return;
      }

      const student = await Student.findById(healthRecord.studentId);
      
      const emailContent = {
        from: process.env.EMAIL_USER,
        to: student.coordinatorEmail,
        subject: `Medical Report - ${student.name}`,
        html: `
          <h2>Student Health Notification</h2>
          <p>Student Name: ${student.name}</p>
          <p>Student ID: ${student.studentId}</p>
          <p>Class: ${student.class}</p>
          <p>Diagnosis: ${healthRecord.diagnosis}</p>
          <p>Recommended Leave: ${healthRecord.recommendedLeave} days</p>
          <p>Reported Date: ${healthRecord.reportedDate}</p>
        `
      };

      await transporter.sendMail(emailContent);
      
      // Update notification status
      healthRecord.notificationSent = true;
      await healthRecord.save();

      return { success: true, message: 'Health notification sent successfully' };
    } catch (error) {
      console.error('Error sending health notification:', error);
      throw error;
    }
  },

  // Send leave notification to parents
  async sendLeaveNotification(leaveRecordId) {
    try {
      const leaveRecord = await LeaveRecord.findById(leaveRecordId)
        .populate('studentId');

      if (!leaveRecord || leaveRecord.parentNotified) {
        return;
      }

      const student = await Student.findById(leaveRecord.studentId);

      const emailContent = {
        from: process.env.EMAIL_USER,
        to: student.parentEmail,
        subject: `Campus Leave Notification - ${student.name}`,
        html: `
          <h2>Student Leave Notification</h2>
          <p>Dear Parent,</p>
          <p>This is to inform you that your ward ${student.name} has left the campus.</p>
          <p>Leave Details:</p>
          <ul>
            <li>Type: ${leaveRecord.leaveType}</li>
            <li>Start Date: ${leaveRecord.startDate}</li>
            <li>End Date: ${leaveRecord.endDate}</li>
            <li>Reason: ${leaveRecord.reason}</li>
          </ul>
          <p>Please contact the college administration if you have any concerns.</p>
        `
      };

      await transporter.sendMail(emailContent);

      // Update notification status
      leaveRecord.parentNotified = true;
      await leaveRecord.save();

      return { success: true, message: 'Leave notification sent successfully' };
    } catch (error) {
      console.error('Error sending leave notification:', error);
      throw error;
    }
  }
};

export default notificationController;