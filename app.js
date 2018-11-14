const requestPromise = require('request-promise');
const cheerio = require('cheerio');

const config = {
	account: 'mediaservicesgroup',
	projectId: '10815255',
	sessionCookie:
		'twisted_token=1c1e8b794c2f3bb489e4bd4f67e9c370c12a; _jsuid=1411205140; session_token=fa7cf68e2817851fe48d; _basecamp_session_v2=BAh7CkkiD3Nlc3Npb25faWQGOgZFRiIlNjMwNmNhOGExMDVlMDYyNWMwZjdhNzE5ZmU0MTA2ZWVJIgx1c2VyX2lkBjsARmkDNJRuSSIQaWRlbnRpdHlfaWQGOwBGaQN5Ai1JIh1tZXNhdXJlX3BhZ2VfcGVyZm9ybWFuY2UGOwBGRkkiEF9jc3JmX3Rva2VuBjsARkkiMTdBL0huTzR5YnBBbXhCOVN4cFZtbFFHeWZDMklKUi9oZG1ERC84WnpTb0k9BjsARg%3D%3D--4016130c70e27f762461fc7a38d4cfde568e5264; flashVersion='
};

const onRequestComplete = $ => {
	console.info('Request Succeed');
	const project = {
		id: config.projectId,
		name: $('#Header h1').clone().children().remove().end().text().replace(/(^\s+|[\t\r\n]|\s+$)/g,''),
		lists: $('.list_wrapper').map((i, e) => {
			let $wrapper = $(e);
			return {
				id: $wrapper.attr('record'), 
				name: $wrapper.find('h2 a').text().replace(/(^\s+|[\t\r\n]|\s+$)/g,'')
			};
		}).get()
	};
	console.log('Results', project);
};

const onRequestError = error => {
	console.error(error);
};

requestPromise({
	uri: 'https://' + config.account + '.basecamphq.com/projects/' + config.projectId + '/todo_lists',
	headers: {
		'User-Agent': 'Request-Promise',
		Cookie: config.sessionCookie
	},
	transform: body => cheerio.load(body)
})
	.then(onRequestComplete)
	.catch(onRequestError);