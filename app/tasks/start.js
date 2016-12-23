/**
 * Created by tianyizhuang on 30/11/2016.
 */

const LibraryUtil = require('../thulib/library')
const EventUtil = require('../thulib/event')
const taskScheduler = require('./task_scheduler')
const updateCourseInfo = require('./update_course_info')
const updateCurriculumInfo = require('./update_curriculum_info')
const updateTeachingInfo = require('./update_teaching_info')
const updateScheduleInfo = require('./update_schedule_info')
const User = require('../models/user')

const start = async () => {
  taskScheduler.add(LibraryUtil.fetch, 300000)
  taskScheduler.add(EventUtil.fetch, 300000)
  const users = await User.find({})
  users.forEach((user) => {
    taskScheduler.add(updateCourseInfo, user, 300000)
    taskScheduler.add(updateCurriculumInfo, user, 300000)
    taskScheduler.add(updateScheduleInfo, user, 300000)
  })
  taskScheduler.add(updateTeachingInfo, users[0], 300000)
}

module.exports = start
