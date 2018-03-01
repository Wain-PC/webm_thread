const request = require('request-promise-native');
const rabbit = require('./utils/rabbit');
const config = require('config').get('webmthread');

const webmRegExp = /^.*?\.(webm|mp4)/i;
const loadVideos = ({boardId, threadId, sourceUrl}) => {
    const threadUrl = `${config.urls.domain}/${boardId}/res/${threadId}.json`;
    rabbit.dbRequest('saveThread',{url: threadUrl, sourceUrl}).then(()=>{
        console.log(`Thread created, loading videos from URL ${threadUrl}`);
        return request({
            method: 'GET',
            uri: threadUrl,
            json: true
        }).then(({threads}) => {
            const videos = threads[0].posts
                .reduce((filesArray, {files}) =>
                    filesArray.concat(files.filter(({fullname}) =>
                        webmRegExp.test(fullname)).map(
                        ({displayname: displayName, path, thumbnail}) => ({
                            url: config.urls.domain + path,
                            displayName,
                            thumbnailUrl: config.urls.domain + thumbnail
                        }))), []);
            console.log(`Total videos in this thread: ${videos.length}`);
            rabbit.dbRequest('saveVideos', {threadUrl, videos});
        }, ({statusCode}) => {
            if (statusCode === 404) {
                console.error(`Thread ${boardId}/${threadId} not found, skipping`);
            }
        });
    });
};


console.log("Starting Rabbit connection!");
rabbit.connect(loadVideos).then(function () {
    console.log("RabbitMQ Connection established, Parser ready for connections");
}, (err) => {
    console.log("RabbitMQ Connection errored with", err);
});