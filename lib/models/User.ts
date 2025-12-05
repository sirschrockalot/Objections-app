import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id: string;
  username: string;
  email?: string;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  isAdmin?: boolean;
  mustChangePassword?: boolean;
}

interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          // Email format validation
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Username must be a valid email address',
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allows multiple null values but enforces uniqueness for non-null
    },
    passwordHash: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLoginAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false, // We're managing createdAt manually
  }
);

// Index for faster lookups
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ isAdmin: 1 });

// Method to compare password
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

// Prevent re-compilation during development
const User: UserModel =
  mongoose.models.User || mongoose.model<IUser, UserModel>('User', UserSchema);

export default User;

