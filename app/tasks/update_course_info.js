/**
 * Created by Songzhou Yang on 12/1/2016.
 */

const LearnHelperUtil = require('../thulib/learnhelper')

const updateCourseInfo = async(user) => {
  const lhu = new LearnHelperUtil(user.username, user.getPassword())
  await lhu.login()
  await lhu.loginCic()
  const courses = await lhu.getCourseList()

  const courseModels = []
  for (const course of courses) {
    const notices = await lhu.getNotices(course._courseID)
    const documents = await lhu.getDocuments(course._courseID)
    const assignments = await lhu.getAssignments(course._courseID)

    courseModels.push({
      courseName: course.courseName,
      courseID: course.courseID,
      unsubmittedOperations: course.unsubmittedOperations,
      unreadNotice: course.unreadNotice,
      newFile: course.newFile,
      notices: notices,
      documents: documents,
      assignments: assignments
    })
  }

  user.courses = courseModels

  await user.save()
}

module.exports = updateCourseInfo
