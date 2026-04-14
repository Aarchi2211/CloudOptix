const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,        // never returned in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: ["User", "Admin"],
      default: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Hash password before saving (only when modified)
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare plain password against stored hash
userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Return safe user object (no password)
userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
