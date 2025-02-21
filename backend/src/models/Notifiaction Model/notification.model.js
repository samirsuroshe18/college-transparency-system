import { Schema, model } from "mongoose";

const notificationSchema = new Schema({
    recipientId: { type: Schema.Types.ObjectId, ref: "User" },
    message: { type: String, required: true },
    readStatus: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});
const Notification = model("Notification", notificationSchema);

export default Notification;