const requestPromise = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');

const config = {
	account: 'mediaservicesgroup',
	projectId: '10815255',
	commentLimit: 3, // null for unlimited
	commentDelay: '2000',  // don't want to look like a DOS attack
	sessionCookie:
		'twisted_token=1c1e8b794c2f3bb489e4bd4f67e9c370c12a; _jsuid=1411205140; session_token=fa7cf68e2817851fe48d; _basecamp_session_v2=BAh7CkkiD3Nlc3Npb25faWQGOgZFRiIlNjMwNmNhOGExMDVlMDYyNWMwZjdhNzE5ZmU0MTA2ZWVJIgx1c2VyX2lkBjsARmkDNJRuSSIQaWRlbnRpdHlfaWQGOwBGaQN5Ai1JIh1tZXNhdXJlX3BhZ2VfcGVyZm9ybWFuY2UGOwBGRkkiEF9jc3JmX3Rva2VuBjsARkkiMTdBL0huTzR5YnBBbXhCOVN4cFZtbFFHeWZDMklKUi9oZG1ERC84WnpTb0k9BjsARg%3D%3D--4016130c70e27f762461fc7a38d4cfde568e5264; flashVersion='
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const onRequestError = error => {
	console.error(error);
};

const requestProject = projectId =>
	requestPromise({
		uri: 'https://' + config.account + '.basecamphq.com/projects/' + projectId + '/todo_lists',
		headers: {
			'User-Agent': 'Request-Promise',
			Cookie: config.sessionCookie
		},
		transform: body => cheerio.load(body)
	});

const parseProjectInfo = $ => {
	let project = {
		id: config.projectId,
		name: $('#Header h1')
			.clone()
			.children()
			.remove()
			.end()
			.text()
			.replace(/(^\s+|[\t\r\n]|\s+$)/g, ''),
		lists: $('.list_wrapper')
			.map((i, e) => {
				let $wrapper = $(e);
				return {
					id: $wrapper.attr('record'),
					name: $wrapper
						.find('h2 a')
						.text()
						.replace(/(^\s+|[\t\r\n]|\s+$)/g, '')
				};
			})
			.get()
	};
	for (let i = 0; i < project.lists.length; i++) {
		let list = project.lists[i];
		let $items = $('#list_' + list.id + '_items .item_wrapper');
		list.todos = $items.map((i,e) => {
			let $item = $(e);
			let itemId = $item.attr('record');
			let $title = $item.find('#item_wrap_' + itemId);
			return {
				id: itemId,
				title: $title.text().replace(/(^\s+|[\t\r\n]|\s+$)/g, '')
			};
		}).get();
	}
	return project;
};

const saveProject = async project => {
	if (!project) return console.error('Project Null or Undefined', project);
	let fileName = 'Project_' + project.id + '_' + project.name.replace(/\s/g, '_') + '.json';
	fs.writeFile(fileName, JSON.stringify(project, null, 1), err => {
		if (err) return console.error(err);
		console.log('Project Saved at ' + fileName);
	});
};

let commentsLoaded = 0;
const getComments = async project => {
	project.lists.forEach(list => {
		list.todos.forEach(async todo => {
			if (config.commentLimit && commentsLoaded >= config.commentLimit) return;
			requestComments(project.id, todo.id)
				.then($ => {
					let $comments = $('#comments');
					if ($comments.children().length < 1) return;
					commentsLoaded++;
					saveComments(project.name, list.name, todo, $comments.html());
				})
				.catch(onRequestError);
			if (config.commentDelay) await sleep(config.commentDelay);
		});
	});
};
const getTodoComments = async (project, list, todo) => {
	requestComments(project.id, todo.id)
		.then($ => {
			let $comments = $('#comments');
			if ($comments.children().length < 1) return;
			commentsLoaded++;
			saveComments(project.name, list.name, todo, $comments.html());
		})
		.catch(onRequestError);
	if (config.commentDelay) await sleep(config.commentDelay);
};

const requestComments = (projectId, todoId) =>
	requestPromise({
		uri: 'https://' + config.account + '.basecamphq.com/projects/' + projectId + '/todo_items/' + todoId + '/comments',
		headers: {
			'User-Agent': 'Request-Promise',
			Cookie: config.sessionCookie
		},
		transform: body => cheerio.load(body)
	});

const saveComments = async (projectName, listName, todo, commentHtml) => {
	if (!commentHtml) return console.error('Comment Null or Undefined', projectName, listName, todo, commentHtml);
	let fileName = 'Todo_' + todo.id + '_' + projectName.replace(/\s/g, '_') + '_' + listName.replace(/\s/g, '_') + '_' + todo.title.replace(/\s/g, '_') + '.txt';
	fs.writeFile(fileName, commentHtml, err => {
		if (err) return console.error(err);
		console.log('Comment Saved at ' + fileName);
	});
};

// Execute
console.log('Running ...');
requestProject(config.projectId)
	.then($ => {
		console.info('Project Received');
		let project = parseProjectInfo($);
		console.info(project.lists.length + ' Lists Found');
		saveProject(project);
		//getComments(project);
		getTodoComments(project, project.lists[1], project.lists[1].todos[0]);
		//console.log('Results', project);
	})
	.catch(onRequestError);
