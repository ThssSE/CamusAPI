const mongoose = require('mongoose')
const CryptoJS = require('crypto-js')
const CourseSchema = require('./course').CourseSchema
const CurriculumClassSchema = require('./curriculum').CurriculumClassSchema
const WeekScheduleSchema = require('./schedule').WeekScheduleSchema
const config = require('../config')
const POSITIONS = ['undergraduate', 'master', 'doctor', 'teacher', 'unknown']

const userInfoSchema = new mongoose.Schema({
  studentNumber: String,
  department: String,
  realName: String,
  email: String,
  position: {
    type: String,
    enum: POSITIONS
  }
}, {
  toObject: {
    transform: (doc, ret) => {
      delete ret._id
    }
  }
})

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    index: true
  },
  password: String,
  info: userInfoSchema,
  _eventIDs: [String],
  courses: [CourseSchema],
  curriculum: [CurriculumClassSchema],
  schedule: [WeekScheduleSchema]
})

userSchema.pre('save', function (next) {
  if (this.isNew) {
    const rawPass = this.password
    this.password = CryptoJS.AES.encrypt(rawPass, config.secretkey).toString()
  }

  next()
})

userSchema.methods.getPassword = function () {
  return CryptoJS.AES.decrypt(this.password, config.secretkey).toString(CryptoJS.enc.Utf8)
}

const User = mongoose.model('User', userSchema)

module.exports = User
