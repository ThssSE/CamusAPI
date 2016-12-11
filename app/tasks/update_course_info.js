/**
 * Created by Songzhou Yang on 12/1/2016.
 */

const LearnHelperUtil = require('../thulib/learnhelper')
const CicLearnHelperUtil = require('../thulib/cic_learnhelper')

const updateCourseInfo = async(user) => {
  const lhu = new LearnHelperUtil(user.username, user.getPassword())
  const cicLhu = new CicLearnHelperUtil(user.username, user.getPassword())
  await lhu.login()
  await cicLhu.login()
  const courses = await lhu.getCourseList()

  const ps = courses.map(course => new Promise(async (resolve) => {
    // TODO: reject
    let notices, documents, assignments
    if (course._courseID.indexOf('-') !== -1) {
      notices = await cicLhu.getNotices(course._courseID)
      documents = await cicLhu.getDocuments(course._courseID)
      assignments = await cicLhu.getAssignments(course._courseID)
      const info = await cicLhu.getTeacherInfo(course._courseID)
      course.teacher = info[0]
      course.email = info[1]
      course.phone = info[2]
    } else {
      notices = await lhu.getNotices(course._courseID)
      documents = await lhu.getDocuments(course._courseID)
      assignments = await lhu.getAssignments(course._courseID)
    }

    resolve({
      courseName: course.courseName,
      courseID: course.courseID,
      teacher: course.teacher,
      email: course.email,
      phone: course.phone,
      unsubmittedOperations: course.unsubmittedOperations,
      unreadNotice: course.unreadNotice,
      newFile: course.newFile,
      notices: notices,
      documents: documents,
      assignments: assignments
    })
  }))

  user.courses = await Promise.all(ps)
  console.log('update learnhelper info done')

  await user.save()
}

module.exports = updateCourseInfo
