const request = require('request-promise-native');
const rabbit = require('./utils/rabbit');
const config = require('config').get('webmthread');

const catalogUrl = config.urls.catalog;
const webmRegExp = /WEBM|ВЕБМ|ШЕБМ|ШЕВМ|MP4|МР4/i;
const onMessage = (message) => {
    console.log("Received message from RabbitMQ:", message);
};

const loadThreads = () => {
    console.log('Loading threads list');
    return request({
        method: 'GET',
        uri: catalogUrl,
        json: true
    }).then(({threads}) => {
        threads.map(({num, subject, comment, posts_count, files_count})=>{
            const subjComment = `${subject} ${comment}`;
            if(webmRegExp.test(subjComment)) {
                console.log(`Found WEBM thread with
                ID: ${num}
                Subject: ${subject}
                Comment: ${comment}
                Posts: ${posts_count}
                Files: ${files_count}
                `);
                rabbit.publish({id: num, subject, comment, posts: posts_count, files: files_count});
            }
        });
    }, err => console.error(err));
};


console.log("Starting Rabbit connection!");
rabbit.connect(onMessage).then(function () {
    console.log("RabbitMQ Connection established");
    loadThreads();
}, (err) => {
    console.log("RabbitMQ Connection errored with", err);
});