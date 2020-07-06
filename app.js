const requestPromise = require('request-promise')
const cheerio = require('cheerio')
const fs = require('fs')
const pad = require('pad')

const config = {
  account: process.env.BASECAMP_ACCOUNT,
  projectId: process.env.BASECAMP_PROJECT_ID,
  projectName: process.env.BASECAMP_PROJECT_NAME,
  sessionCookie: process.env.BASECAMP_SESSION_COOKIE,
}

const onRequestError = (error) => {
  console.error(error)
}

const getTodoLists = ($) => {
  return $('.todolist')
    .map((i, e) => {
      let $wrapper = $(e)
      return {
        id: $wrapper.attr('data-recording-id'),
        name:
          `US${pad(3, i + 1, '0')}: ` +
          $wrapper
            .find('.todolist__permalink')
            .text()
            .replace(/(^\s+|[\t\r\n]|\s+$)/g, ''),
        content: $wrapper.find('.todolist__description--truncated a').attr('title') || '',
      }
    })
    .get()
}

const getProjectMetadata = ($) => ({
  id: config.projectId,
  name: config.projectName,
  lists: getTodoLists($),
})

const parseProjectInfo = ($) => {
  const project = getProjectMetadata($)
  for (let i = 0; i < project.lists.length; i++) {
    let list = project.lists[i]
    let $items = $('#recording_' + list.id + ' .todo')
    console.log('#recording_' + list.id + ' .todo')
    list.tasks = $items
      .map((i, e) => {
        let $item = $(e)
        let itemId = $item.attr('data-recording-id')
        let $title = $item.find('a')
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
  if (!project) return console.error('Project Null or Undefined', project)
  let fileName = 'Project_' + project.id + '_' + project.name.replace(/\s/g, '_') + '.json'
  fs.writeFile(fileName, JSON.stringify(project, null, 1), (err) => {
    if (err) return console.error(err)
    console.log('Project Saved at ' + fileName)
  })
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
console.log('Running ...')
requestProject(config.projectId)
  .then(($) => {
    console.info('Project Received')
    let project = parseProjectInfo($)
    console.info(project.lists.length + ' Lists Found')
    saveProject(project)
  })
  .catch(onRequestError)
