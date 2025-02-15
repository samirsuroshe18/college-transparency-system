import { Schema, model } from "mongoose";
import { hash } from "bcrypt";

const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "admin"], default: "student" }
});

// Hash password before saving user
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await hash(this.password, 10);
    next();
});

const User = model("User", UserSchema);
export default User;
