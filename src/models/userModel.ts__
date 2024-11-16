import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  googleId: {
    type: String,
  },
  image: {
    type: String,
  },
  authMethods: [
    {
      type: String,
      enum: ["local", "google"],
      default: ["local"],
    },
  ],
  password: {
    // Hashed password for local auth
    type: String,
  },
});

const UserModel = mongoose.model("user", userSchema);

export default UserModel;
