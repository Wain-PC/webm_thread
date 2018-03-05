const request = require('request-promise-native');
const rabbit = require('rabbit');
const config = require('config').get('webmthread');
const domain = config.finder.domain;

const webmRegExp = /WEBM|ВЕБМ|ШЕБМ|ШЕВМ|MP4|МР4/i;
const loadSources = () => rabbit.dbRequest('addSource', {url: config.finder.catalog, displayName: '2ch.hk/b'});
const loadThreads = ({url: sourceUrl, _id}) => {
    console.log(`Loading threads list from ${sourceUrl} (ID: ${_id})`);
    return request({
        method: 'GET',
        uri: sourceUrl,
        json: true
    }).then(({threads}) => threads.reduce(function (webmThreads, thread) {
        const {num, subject, comment, posts_count, files_count} = thread;
        const subjComment = `${subject} ${comment}`;
        if (webmRegExp.test(subjComment)) {
            const url = `${domain}/b/res/${num}.json`;
            console.log(`Found WEBM thread with
                URL: ${url}
                Subject: ${subject}
                Comment: ${comment}
                Posts: ${posts_count}
                Files: ${files_count}
                `);
            webmThreads.push({id: +num, url, subject, comment, postsCount: posts_count, filesCount: files_count});
        }
        return webmThreads;
    }, []))
        .then(threads => rabbit.dbRequest('addThreads', {sourceId: _id, threads}))
        .then(() => rabbit.dbRequest('getThreads', {sourceId: _id}))
        // Do not send all videos at once to prevent backend overload. Send one thread every N seconds
        // (value taken from config).
        .then(webmThreads => {
            webmThreads.map(({url}, i) => setTimeout(() => {
                console.log(`Pushing thread ${url} to loadVideos`);
                loadVideos(url);
            }, config.finder.threadParseInterval * i));

        });
};
const loadVideos = (url) =>
    request({
        method: 'GET',
        uri: url,
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
        rabbit.dbRequest('addVideos', {url, videos});
    }, ({statusCode}) => {
        if (statusCode === 404) {
            console.error(`Thread ${url} not found, skipping`);
            rabbit.dbRequest('removeThread', {url});
        }
    });

const work = () => loadSources().then(loadThreads);
const start = () => work()
    .then(() =>
        setTimeout(start, config.finder.updateTimeout)
    );

console.log("Starting Rabbit connection!");
rabbit.connect().then(function () {
    console.log("RabbitMQ Connection established");
    start();
}, (err) => {
    console.log("RabbitMQ Connection errored with", err);
});