/**
 * User Model
 * Defines the schema for anonymous users
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

const clanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  emoji: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  description: {
    type: String
  }
}, { _id: false });

const statsSchema = new mongoose.Schema({
  totalPoints: {
    type: Number,
    default: 0
  },
  postsCount: {
    type: Number,
    default: 0
  },
  likesReceived: {
    type: Number,
    default: 0
  },
  likesGiven: {
    type: Number,
    default: 0
  },
  commentsReceived: {
    type: Number,
    default: 0
  },
  commentsGiven: {
    type: Number,
    default: 0
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  avatarColor: {
    type: String,
    required: true
  },
  clan: {
    type: clanSchema,
    required: true
  },
  stats: {
    type: statsSchema,
    default: () => ({})
  },
  level: {
    type: Number,
    default: 1
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  identityRegeneratedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
// Keep username unique via schema; text index removed unless full-text is required.
// If you need full-text search on username, re-enable text index intentionally.
userSchema.index({ username: 1 });
userSchema.index({ 'clan.name': 1 });
// Compound index to speed up clan leaderboards and member queries
userSchema.index({ 'clan.name': 1, 'stats.totalPoints': -1 });
// Optional presence/lastSeen index
userSchema.index({ isOnline: 1, lastSeen: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Hash password when using findOneAndUpdate or findByIdAndUpdate with a password change
userSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (!update) return next();

  // Handle both top-level and $set updates
  const password = update.password || (update.$set && update.$set.password);
  if (!password) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);

    if (update.password) update.password = hash;
    if (update.$set && update.$set.password) update.$set.password = hash;

    this.setUpdate(update);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Compare password method (defensive if password not selected)
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate level based on points
userSchema.methods.calculateLevel = function() {
  const points = this.stats.totalPoints || 0;
  if (points < 100) return 1;
  if (points < 500) return 2;
  if (points < 1000) return 3;
  if (points < 2500) return 4;
  if (points < 5000) return 5;
  if (points < 10000) return 6;
  if (points < 25000) return 7;
  if (points < 50000) return 8;
  if (points < 100000) return 9;
  return 10;
};

// Update stats and recalculate level
userSchema.methods.addPoints = async function(points) {
  this.stats.totalPoints = (this.stats.totalPoints || 0) + points;
  this.level = this.calculateLevel();
  await this.save();
};

// Get public profile (no sensitive data)
userSchema.methods.toPublicProfile = function() {
  const obj = this.toObject({ getters: true, versionKey: false });
  return {
    _id: obj._id,
    username: obj.username,
    avatarColor: obj.avatarColor,
    clan: obj.clan,
    stats: obj.stats,
    level: obj.level,
    isOnline: obj.isOnline,
    lastSeen: obj.lastSeen,
    createdAt: obj.createdAt
  };
};

const User = mongoose.model('User', userSchema);

export default User;