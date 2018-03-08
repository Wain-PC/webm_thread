const request = require('request-promise-native');
const rabbit = require('rabbit');
const config = require('config').get('webmthread');
const domain = config.finder.domain;

let publishFn, rpcFn;
const webmRegExp = /WEBM|ВЕБМ|ШЕБМ|ШЕВМ|ЦУИЬ|MP4|МР4/i;
const loadSources = () => rpcFn('addSource', {url: config.finder.catalog, displayName: config.finder.displayName});
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
            const url = domain + config.finder.threadUrl.replace(/\${(\w+?)}/g, (match, p1) => thread[p1]);
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
        .then(threads => rpcFn('addThreads', {sourceId: _id, threads}))
        .then(() => rpcFn('getThreads', {sourceId: _id}))
        // Do not send all videos at once to prevent backend overload. Send one thread every N seconds
        // (value taken from config).
        .then(webmThreads => {
            webmThreads.map(({url, id}, i) => setTimeout(() => {
                console.log(`Pushing thread ${url} to loadVideos`);
                loadVideos(_id, id, url);
            }, config.finder.threadParseInterval * i));

        });
};
const loadVideos = (sourceId, threadId, url) =>
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
        console.log(`Total videos in thread ${threadId}: ${videos.length}`);
        videos.forEach(v=>publishFn(v));
        if(videos.length < config.finder.minVideosInThread) {
            console.error(`Thread ${threadId} has too low videos, skipping (limit: ${config.finder.minVideosInThread}`);
            return rpcFn('removeThread', {sourceId, threadId});
        }
        return rpcFn('addVideos', {url, videos});
    }, ({statusCode}) => {
        if (statusCode === 404) {
            console.error(`Thread ${threadId} not found, skipping`);
            return rpcFn('removeThread', {sourceId, threadId});
        }
    });

const work = () => loadSources().then(loadThreads);
const start = () => work()
    .then(() =>
        setTimeout(start, config.finder.updateTimeout)
    );

console.log("Starting Rabbit connection!");
rabbit.connect().then((rabbitInstance) => {
    const {publish, dbRequests, dbResponses} = config.rabbitMQ.exchanges;
    return rabbitInstance.publish({name: publish})
        .then(pFn => {
            publishFn = pFn;

        })
        .then(()=>{
            return rabbitInstance.rpc({request: dbRequests, response: dbResponses})
                .then(rFn => {
                    rpcFn = rFn;
                })
        })
        .then(()=>{
            console.log("RabbitMQ Connection established");
            start();
        })
}, (err) => {
    console.log("RabbitMQ Connection errored with", err);
});
