/**
 * Created by tianyizhuang on 30/11/2016.
 */

const rp = require('request-promise')
const cheerio = require('cheerio')


class LibraryUtil {
  static get result() {
    return LibraryUtil._result
  }

  static async fetch() {
    try {
      const options = {
        method: 'GET',
        uri: LibraryUtil.HS_ROOMSHOW_URL,
        transform: (body) => {
          return cheerio.load(body)
        }
      }

      const $ = await rp(options)
      const elements =
        Array
          .from($('td'))
          .slice(5)
          .map((el) => $(el).text().trim())

      const areas = []
      for (let i = 0; i < elements.length; i += 3) {
        areas.push({
          'name': elements[i],
          'used': parseInt(elements[i + 1]),
          'left': parseInt(elements[i + 2])
        })
      }

      LibraryUtil._result = areas
    } catch (e) {
      console.error(e)
    }
  }
}

LibraryUtil._result = []
LibraryUtil.HS_ROOMSHOW_URL = 'http://seat.lib.tsinghua.edu.cn/roomshow/'

module.exports = LibraryUtil
