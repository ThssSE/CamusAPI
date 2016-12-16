/**
 * Created by tianyizhuang on 07/12/2016.
 */

const rp = require('request-promise')
const h2t = require('html-to-text')
const AuthUtil = require('./auth')


class CicLearnHelperUtil {
  constructor(username, password) {
    this.cookies = rp.jar()
    this.username = username
    this.password = password
    this.prefix = 'http://learn.cic.tsinghua.edu.cn'
  }

  async login() {
    try {
      const ticket = await AuthUtil.getTicket(this.username, this.password, 'WLXT')
      const options = {
        uri: `${this.prefix}/j_spring_security_thauth_roaming_entry?status=SUCCESS&ticket=${ticket}`,
        method: 'GET',
        jar: this.cookies
      }

      await rp(options)
    } catch (e) {
      // TODO: error handler
      console.error(e)
    }
  }

  async getTeacherInfo(courseID) {
    const infoUrl = `${this.prefix}/b/mycourse/SpeakTeacher/list/${courseID}`
    try {
      const res = await rp({
        method: 'POST',
        uri: infoUrl,
        jar: this.cookies,
        json: true
      })
      const info = res.resultList.teacherInfo
      const teacher = info.name ? info.name : ''
      const email = info.email ? info.email : ''
      const phone = info.phone ? info.phone : ''
      return [teacher, email, phone]
    } catch (e) {
      console.error(e)
      return ['', '', '']
    }
  }

  async getNotices(courseID) {
    const noticeUrl = `${this.prefix}/b/myCourse/notice/listForStudent/${courseID}?currentPage=1&pageSize=1000`
    try {
      const res = await rp({
        method: 'GET',
        uri: noticeUrl,
        jar: this.cookies,
        json: true
      })

      const ps = res.paginationList.recordList.map(rawNoticeInfo => new Promise(async (resolve) => {
        const notice = {}

        if (rawNoticeInfo.status) {
          notice.state = rawNoticeInfo.status.trim() === '1' ? 'read' : 'unread'
        } else {
          notice.state = 'unread'
        }
        const rawNotice = rawNoticeInfo.courseNotice
        notice.noticeID = rawNotice.id
        notice.title = rawNotice.title
        notice.publisher = rawNotice.owner
        notice.publishTime = new Date(`${rawNotice.regDate} 00:00:00`).getTime()

        const detailUrl = `${this.prefix}/b/myCourse/notice/studDetail/${notice.noticeID}`
        const det = await rp({
          method: 'GET',
          uri: detailUrl,
          jar: this.cookies,
          json: true
        })

        if (det.dataSingle) {
          notice.content = h2t.fromString(det.dataSingle.detail)
        } else {
          notice.content = ''
        }

        resolve(notice)
      }))

      const notices = await Promise.all(ps)

      return notices
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async getDocuments(courseID) {
    const documentUrl = `${this.prefix}/b/myCourse/tree/getCoursewareTreeData/${courseID}/0`
    const documents = []
    try {
      const res = await rp({
        method: 'GET',
        uri: documentUrl,
        jar: this.cookies,
        json: true
      })

      const list = Object.values(Object.values(res.resultList)[0].childMapData)
      const items = []
      list.map(obj => {
        items.push.apply(items, obj.courseCoursewareList)
      })

      for (const item of items) {
        const document = {}
        document.title = item.title
        document.explanation = item.detail ? item.detail : ''
        document.updatingTime = item.resourcesMappingByFileId.regDate
        document.state = 'unknown'
        document.size = `${item.resourcesMappingByFileId.fileSize}B`
        document.url = `${this.prefix}/b/resource/downloadFileStream/${item.resourcesMappingByFileId.fileId}`
        documents.push(document)
      }

      return documents
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async getAssignments(courseID) {
    const assignmentUrl = `${this.prefix}/b/myCourse/homework/list4Student/${courseID}/0`
    const assignments = []
    try {
      const res = await rp({
        method: 'GET',
        uri: assignmentUrl,
        jar: this.cookies,
        json: true
      })

      for (const rawAssignment of res.resultList) {
        const assignment = {}
        const info = rawAssignment.courseHomeworkInfo
        const record = rawAssignment.courseHomeworkRecord

        assignment.assignmentID = info.homewkId ? info.homewkId : ''
        assignment.title = info.title ? info.title : ''
        assignment.startDate = info.beginDate ? info.beginDate : 0
        assignment.dueDate = info.endDate ? info.endDate : 0
        if (info.detail) {
          assignment.detail = h2t.fromString(info.detail)
        } else {
          assignment.detail = ''
        }
        assignment.state = record.status === '0' ? '尚未提交' : '已经提交'

        assignment.fileUrl = info.homewkAffix ? info.homewkAffix : ''
        assignment.filename = info.homewkAffixFilename ? info.homewkAffixFilename : ''
        assignment.size = 'unknown'

        assignment.scored = record.status === '3'
        assignment.grade = record.mark ? record.mark : -1
        if (record.replyDetail) {
          assignment.comment = h2t.fromString(record.replyDetail)
        } else {
          assignment.comment = ''
        }
        assignment.evaluatingTeacher = record.gradeUser ? record.gradeUser : ''
        assignment.evaluatingDate = record.replyDate ? record.replyDate : 0

        assignments.push(assignment)
      }
      return assignments
    } catch (e) {
      console.error(e)
      return []
    }
  }


  async getCurrentTeachingInfo() {
    const url = `${this.prefix}/b/myCourse/courseList/getCurrentTeachingWeek`
    const info = {}
    try {
      const res = await rp({
        method: 'GET',
        uri: url,
        jar: this.cookies,
        json: true
      })
      info.time = Date.now()

      info.currentSemester = {}
      info.currentSemester.name = res.currentSemester.semesterName
      info.currentSemester.id = res.currentSemester.id
      info.currentSemester.beginTime = new Date(`${res.currentSemester.startDate} 00:00:00`).getTime()
      info.currentSemester.endTime = new Date(`${res.currentSemester.endDate} 23:59:59`).getTime()

      info.currentTeachingWeek = {}
      info.currentTeachingWeek.name = res.currentTeachingWeek.weekName
      info.currentTeachingWeek.id = res.currentTeachingWeek.teachingWeekId.toString()
      info.currentTeachingWeek.beginTime = new Date(`${res.currentTeachingWeek.beginDate} 00:00:00`).getTime()
      info.currentTeachingWeek.endTime = new Date(`${res.currentTeachingWeek.endDate} 23:59:59`).getTime()

      info.nextSemester = {}
      info.nextSemester.name = res.nextSemester.semesterName
      info.nextSemester.id = res.nextSemester.id
      info.nextSemester.beginTime = new Date(`${res.nextSemester.startDate} 00:00:00`).getTime()
      info.nextSemester.endTime = new Date(`${res.nextSemester.endDate} 23:59:59`).getTime()

      return info
    } catch (e) {
      console.error(e)
      return {}
    }
  }
}

module.exports = CicLearnHelperUtil
