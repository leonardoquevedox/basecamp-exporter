const requestPromise = require('request-promise')
const cheerio = require('cheerio')
const fs = require('fs')
const pad = require('pad')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config()

const config = {
  account: process.env.BASECAMP_ACCOUNT,
  projectId: process.env.BASECAMP_PROJECT_ID,
  projectName: process.env.BASECAMP_PROJECT_NAME,
  sessionCookie: process.env.BASECAMP_SESSION_COOKIE,
}

const EXPORT_FOLDER = process.env.EXPORT_FOLDER || 'export'

const { log, error: logError } = console

const onRequestError = (error) => {
  logError(error)
}

const getTodoLists = ($) =>
  $('.todolist')
    .map((i, e) => {
      const $wrapper = $(e)
      return {
        id: $wrapper.attr('data-recording-id'),
        name: `US${pad(3, i + 1, '0')}: `.concat(
          $wrapper
            .find('.todolist__permalink')
            .text()
            .replace(/(^\s+|[\t\r\n]|\s+$)/g, ''),
        ),
        content: $wrapper.find('.todolist__description--truncated a').attr('title') || '',
      }
    })
    .get()

const getProjectMetadata = ($) => ({
  id: config.projectId,
  name: config.projectName,
  lists: getTodoLists($),
})

const parseProjectInfo = ($) => {
  const project = getProjectMetadata($)
  for (let i = 0; i < project.lists.length; i++) {
    const list = project.lists[i]
    const $items = $(`#recording_${list.id} .todo`)
    list.tasks = $items
      .map((j, e) => {
        const $item = $(e)
        const itemId = $item.attr('data-recording-id')
        const $title = $item.find('a')
        return {
          // id: itemId,
          title: $title.text().replace(/(^\s+|[\t\r\n]|\s+$)/g, ''),
        }
      })
      .get()
  }
  return project
}

const saveProject = async (project) => {
  if (!project) return logError('Project Null or Undefined', project)
  const fileName = `Project_${project.id}_${project.name.replace(/\s/g, '_')}.json`
  fs.writeFile(
    path.join(__dirname, EXPORT_FOLDER, fileName),
    JSON.stringify(project, null, 1),
    (err) => {
      if (err) return logError(err)
      log(`Project saved at "${fileName}"!`)
    },
  )
}

const requestProject = (projectId) =>
  requestPromise({
    uri: `https://3.basecamp.com/${config.account}/buckets/${projectId}/recordings/1720944481/archive`,
    headers: {
      'User-Agent': 'Request-Promise',
      Cookie: config.sessionCookie,
    },
    transform: (body) => cheerio.load(body),
  })

// Execute
log('Fetching project data...')
requestProject(config.projectId)
  .then(($) => {
    log('Project data received!')
    const project = parseProjectInfo($)
    log(`${project.lists.length} ToDo lists found!`)
    saveProject(project)
  })
  .catch(onRequestError)
