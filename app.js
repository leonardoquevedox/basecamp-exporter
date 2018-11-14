const requestPromise = require('request-promise');
const cheerio = require('cheerio');

const requestOptions = {
	uri: 'https://mediaservicesgroup.basecamphq.com/projects/10815255-plm/todo_lists',
	headers: {
		'User-Agent': 'Request-Promise',
		'Cookie' : 'twisted_token=1c1e8b794c2f3bb489e4bd4f67e9c370c12a; _jsuid=1411205140; session_token=fa7cf68e2817851fe48d; _basecamp_session_v2=BAh7CkkiD3Nlc3Npb25faWQGOgZFRiIlNjMwNmNhOGExMDVlMDYyNWMwZjdhNzE5ZmU0MTA2ZWVJIgx1c2VyX2lkBjsARmkDNJRuSSIQaWRlbnRpdHlfaWQGOwBGaQN5Ai1JIh1tZXNhdXJlX3BhZ2VfcGVyZm9ybWFuY2UGOwBGRkkiEF9jc3JmX3Rva2VuBjsARkkiMTdBL0huTzR5YnBBbXhCOVN4cFZtbFFHeWZDMklKUi9oZG1ERC84WnpTb0k9BjsARg%3D%3D--4016130c70e27f762461fc7a38d4cfde568e5264; flashVersion='
	},
	transform: (body) => cheerio.load(body)
};

const onRequestComplete = ($) => { 
	console.info('Request Succeed at ' + requestOptions.uri); 
	const results = { lists: [] };
	$('.list_wrapper').each((i, e) => {
		let $wrapper = $(e);
		let listId = $wrapper.attr('record');
		results.lists.push({ id: listId, element: '#' + $wrapper.attr('id') + '.' + $wrapper.attr('class') });
		//console.log('Found', $wrapper.html());
	});
	console.log('Results', results);
};

const onRequestError = (error) => { console.error(error); };

requestPromise(requestOptions)
	.then(onRequestComplete)
	.catch(onRequestError);