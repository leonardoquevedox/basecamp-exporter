const requestPromise = require('request-promise');
const cheerio = require('cheerio');

const requestOptions = {
	uri: 'http://www.indasysllc.com',
	transform: (body) => cheerio.load(body)
};

const onRequestComplete = (data) => { console.info(data); };
const onRequestError = (error) => { console.error(error); };

requestPromise(requestOptions)
	.then(onRequestComplete)
	.catch(onRequestError);