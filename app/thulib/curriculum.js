/**
 * Created by XiYe on 12/1/2016.
 */
const rp = require('request-promise').defaults({jar: true})
const ci = require('cheerio')
const iconv = require('iconv-lite')

const AuthUtil = require('../thulib/auth')
class CurriculumUtil {

  static async parseWeekStr(s) {
    const range = (start, end, stride = 1) => {
      if (isNaN(start) || isNaN(end)) {
        throw 'Unknown Curriculum Week Format Exception'
      }
      const x = []
      for (let i = start; i <= end; i += stride) {
        x.push(i)
      }
      return x
    }

    const parseMultiGroupWeek = (s) => {
      let week = []
      let index = s.indexOf('-')
      while (index !== -1) {
        const startWeek = parseInt(s.slice(0, index))
        s = s.slice(index + 1, s.length)
        index = s.indexOf(',')
        index = index > 0 ? index : s.indexOf('周')
        const endWeek = parseInt(s.slice(0, index))
        s = s.slice(index + 1, s.length)
        week = week.concat(range(startWeek, endWeek))
        index = s.indexOf('-')
      }
      return week
    }

    let week = []
    switch (s) {
    case '全周':
      week = range(1, 16)
      break
    case '前八周':
      week = range(1, 8)
      break
    case '后八周':
      week = range(9, 16)
      break
    case '单周':
      week = range(1, 16, 2)
      break
    case '双周':
      week = range(2, 16, 2)
      break
    default:
      week = parseMultiGroupWeek(s)
      break
    }

    const weekFlag = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    for (const i in week) {
      weekFlag[week[i] - 1] = 1
    }
    return weekFlag
  }

  static async parseFirstLevelCurriculum($) {
    const classes = []
    $('.kc_div').each(async (i, elem) => {
      const course = {}

      //Course ID and Time
      const classStr = $(elem).attr('class').split(' ')[1]
      const courseID = classStr.slice(2, 10)
      const time = [parseInt(classStr[0]), parseInt(classStr[1])]
      const courseSequence = parseInt(classStr.slice(10))
      //Course Name
      const courseName = $(elem).find('h5').first().children().first().text()
      //Teacher
      const teacherStr = $(elem).find('h5').first().children().last().text()
      const teacher = teacherStr.slice(0, teacherStr.indexOf('&'))

      const li = $(elem).find('li').get(1)
      //Weeks
      let weekStr = $(li).find('span').first().text()
      weekStr = weekStr.slice(weekStr.indexOf('(') + 1, weekStr.indexOf(')'))
      const week = await CurriculumUtil.parseWeekStr(weekStr)

      //Classroom
      const classroom = $(li).find('span').last().text()

      course['coursename'] = courseName
      course['teacher'] = teacher
      course['courseid'] = courseID
      course['coursesequence'] = courseSequence
      course['time'] = time
      course['classroom'] = classroom
      course['week'] = week
      console.log(course)
      classes.push(course)
    })
    return classes
  }

  static async getFirstLevelCurriculum(username, password, isGraduate) {
    const prefix = 'http://zhjw.cic.tsinghua.edu.cn/'
    const curriculumUndergraduateFirstLevelUrlMobile =
      `${prefix}/portal3rd.do?m=bks_yjkbSearch&mobile=true`
    const curriculumGraduateFirstLevelUrlMobile =
      `${prefix}/portal3rd.do?m=yjs_kbSearch&mobile=true`
    const ticket = await AuthUtil.getTicket(username, password, 'ALL_ZHJW')
    const loginUrl =
      `http://zhjw.cic.tsinghua.edu.cn/j_acegi_login.do?ticket=${ticket}`

    const cookies = rp.jar()

    let classes = []
    const loginOptions = {
      method: 'GET',
      uri: loginUrl,
      jar: cookies
    }

    const curriculumOptions = {
      method: 'GET',
      uri: isGraduate ?
        curriculumGraduateFirstLevelUrlMobile:
        curriculumUndergraduateFirstLevelUrlMobile,
      jar: cookies,
      encoding: null,
      transform: function (body) {
        const html = iconv.decode(body, 'GBK')
        return ci.load(html, {decodeEntities: false})
      }
    }

    const crawlCurriculum = () => {
      rp(curriculumOptions)
        .then(
          ($) => {
            classes = CurriculumUtil.parseFirstLevelCurriculum($)
          })
        .catch(
          () => {
            console.log('Crawl Curriculum failed')
          }
        )
    }

    rp(loginOptions)
      .then(
        () => {
          crawlCurriculum()
        }
      )
      .catch(
        () => {
          console.log('Login ALL_ZHJW failed')
        }
      )

    return classes
  }
}

module.exports = CurriculumUtil
