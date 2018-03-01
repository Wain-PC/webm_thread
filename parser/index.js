const request = require('request-promise-native');
const rabbit = require('./utils/rabbit');
const config = require('config').get('webmthread');

const webmRegExp = /^.*?\.(webm|mp4)/i;
const loadVideos = ({boardId, threadId}) => {
    console.log(`Loading videos from URL ${config.urls.domain}${boardId}/res/${threadId}.json`);
    return request({
        method: 'GET',
        uri: `${config.urls.domain}${boardId}/res/${threadId}.json`,
        json: true
    }).then(({threads}) => {
        const posts = threads[0].posts;
        let count = 0;
        posts.map(({files})=>files.map(({displayname, fullname, path, thumbnail, duration, md5}) => {
            if(webmRegExp.test(fullname)) {
                count++;
                console.log(`Found video with
                Board: /${boardId}
                Thread: ${threadId}
                Name: ${displayname}
                Path: ${path}
                Thumbnail: ${thumbnail}
                Duration (sec): ${duration}
                MD5: ${md5}
                `);
            }
        }));
        console.log(`Total videos in this thread: ${count}`);
    }, ({statusCode}) => {
        if(statusCode === 404) {
            console.error(`Thread ${boardId}/${threadId} not found, skipping`);
        }
    });
};


console.log("Starting Rabbit connection!");
rabbit.connect(loadVideos).then(function () {
    console.log("RabbitMQ Connection established, Parser ready for connections");
}, (err) => {
    console.log("RabbitMQ Connection errored with", err);
});