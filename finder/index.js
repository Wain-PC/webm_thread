const request = require('request-promise-native');
const rabbit = require('./utils/rabbit');
const config = require('config').get('webmthread');

const webmRegExp = /WEBM|ВЕБМ|ШЕБМ|ШЕВМ|MP4|МР4/i;
const onMessage = (message) => {
    console.log("Received message from RabbitMQ:", message);
};

const loadSources = () => rabbit.dbRequest('getSources');

const loadThreads = (sourceUrl) => {
    console.log(`Loading threads list from ${sourceUrl}`);
    return request({
        method: 'GET',
        uri: sourceUrl,
        json: true
    }).then(({threads}) => threads.reduce(function (webmThreads, thread) {
        const {num, subject, comment, posts_count, files_count} = thread;
        const subjComment = `${subject} ${comment}`;
        if (webmRegExp.test(subjComment)) {
            console.log(`Found WEBM thread with
                ID: ${num}
                Subject: ${subject}
                Comment: ${comment}
                Posts: ${posts_count}
                Files: ${files_count}
                `);
            webmThreads.push({boardId: 'b', threadId: num, sourceUrl});
        }
        return webmThreads;
    }, []))
    // Do not send all videos at once to prevent backend overload. Send one thread every N seconds
    // (value taken from config).
        .then(webmThreads => {
            webmThreads.map((thread, i) => setTimeout(() => {
                console.log(`Pushing thread ${thread.threadId} to loadVideos`);
                loadVideos(thread);
            }, config.finder.threadParseInterval * i));

        });
};

const loadVideos = ({boardId, threadId, sourceUrl}) => {
    const domain = config.finder.domain;
    const threadUrl = `${domain}/${boardId}/res/${threadId}.json`;
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
                            url: domain + path,
                            displayName,
                            thumbnailUrl: domain + thumbnail
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

const work = () => loadSources().then(sources => sources.map(({url}) => loadThreads(url)));
const start = () => work()
    .then(()=>
        setTimeout(start, config.finder.updateTimeout)
    );

console.log("Starting Rabbit connection!");
rabbit.connect(onMessage).then(function () {
    console.log("RabbitMQ Connection established");
    start();
}, (err) => {
    console.log("RabbitMQ Connection errored with", err);
});