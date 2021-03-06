/**
 * Created by XiYe on 12/23/2016.
 */

const mongoose = require('mongoose')

const ScheduleActivitySchema = new mongoose.Schema({
  place: {
    type: String
  },
  type: {
    type: String
  },
  startTime: {
    type: String
  },
  dueTime: {
    type: String
  },
  date: {
    type: String
  },
  content: {
    type: String
  },
  description: {
    type: String
  }
}, {
  toObject: {
    transform: (doc, ret) => {
      delete ret._id
    }
  }
})

const WeekScheduleSchema = new mongoose.Schema({
  week: {
    type: Number,
    index: true
  },
  weekSchedule: {
    type: [ScheduleActivitySchema]
  }
}, {
  toObject: {
    transform: (doc, ret) => {
      delete ret._id
    }
  }
})

const ScheduleActivity = mongoose.model('ScheduleActivitySchema', ScheduleActivitySchema)
const WeekSchedule = mongoose.model('WeekScheduleSchema', WeekScheduleSchema)

module.exports.ScheduleActivity = ScheduleActivity
module.exports.WeekScedule = WeekSchedule
module.exports.WeekScheduleSchema = WeekScheduleSchema
