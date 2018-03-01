const amqp = require('amqplib');
const url = require('url');
const uuid = require('uuid/v1');

const config = require('config').get('webmthread').get('rabbitMQ');

let channelPromise;
const channelRoutingKey = uuid();

const subscribeToExchange = (channel, exchangeName, callback) => {
    channel.assertExchange(exchangeName, 'fanout');
    channel.assertQueue(null, {durable: false, autoDelete: true})
        .then(({queue}) => {
            channel.bindQueue(queue, exchangeName, channelRoutingKey);
            channel.consume(queue, callback, {noAck: true});
            return channel;
        });
};

const connectionInitialize = (url) => amqp.connect(url)
    .catch((err) => new Promise(resolve => {
        console.log(`Rabbit is unavailable (${err}), waiting to try again in ${config.reconnectTimeout / 1000} seconds `);
        setTimeout(() => resolve(connectionInitialize(url)), config.reconnectTimeout);
    }));

const connect = (onMessage = () => {
}) => {
    const {
        username, password, hostname, port,
    } = config;
    const connectionURL = url.format({
        protocol: 'amqp',
        slashes: true,
        hostname,
        port,
        auth: `${username}:${password}`,
    });
    channelPromise = connectionInitialize(connectionURL)
        .then(connection => {
            console.log('Creating Channel');
            return connection.createChannel();
        })
        .then(channel => {
            const {publish, subscribe, dbRequests, dbResponses} = config.exchanges;
            const promiseArray = [];
            console.log("Got channel");
            if (publish) {
                console.log(`Found publish ability to exchange ${publish}, creating exchange...`);
                channel.assertExchange(publish, 'fanout');
            }
            if (subscribe) {
                console.log(`Found subscription to exchange ${subscribe}, subscribing...`);
                promiseArray.push(subscribeToExchange(channel, subscribe, (message) => {
                    const {content} = message;
                    onMessage(JSON.parse(content.toString("utf-8")));
                }));
            }
            if (dbRequests && dbResponses) {
                console.log(`Found subscription to exchange ${dbResponses}, subscribing...`);
                promiseArray.push(subscribeToExchange(channel, dbResponses, (message) => {
                    const {content, properties: {correlationId}} = message;
                    console.log(`Received DB response
                    with corrId ${correlationId}, checking...`);
                    if (requests[correlationId]) {
                        const {resolve, reject} = requests[correlationId];
                        let payload = {};
                        try {
                            payload = JSON.parse(content.toString("utf-8"));
                        } catch (err) {
                            payload = {
                                error: 'Failed to parse response'
                            };
                        }
                        if (payload.hasOwnProperty('error')) {
                            reject(payload);
                        } else {
                            resolve(payload);
                        }
                        delete requests[correlationId];
                    }
                }));
            }
            return Promise.all(promiseArray).then(() => channel);
        });
    return channelPromise;
};

const publish = (payloadObj) => {
    const {publish} = config.exchanges;
    if (!channelPromise) {
        return Promise.reject(new Error('No RabbitMQ connection available to publish'));
    }
    if (!publish) {
        return Promise.reject(new Error('No `publish` exchange set in config, nowhere to publish the message.'));
    }

    const correlationId = uuid();

    return channelPromise
        .then(channel => channel.publish(publish, config.routingKey, new Buffer(JSON.stringify(payloadObj)), {
            deliveryMode: 2,
            contentType: 'application/json',
            replyTo: channelRoutingKey,
            correlationId,
        })).catch(err => console.error(err));
};

//TODO: Rewrite using memcached
const requests = {};

const dbRequest = (type, payload = {}) => {
    const {dbRequests} = config.exchanges;
    if (!channelPromise) {
        return Promise.reject(new Error('No RabbitMQ connection available to publish'));
    }

    return new Promise((resolve, reject) => {
        const correlationId = uuid();
        channelPromise
            .then(channel => channel.publish(dbRequests, config.routingKey, new Buffer(JSON.stringify({
                type,
                payload
            })), {
                deliveryMode: 2,
                contentType: 'application/json',
                replyTo: channelRoutingKey,
                correlationId,
            }))
            .then(
                () => {
                    requests[correlationId] = {resolve, reject};
                },
                (err) => {
                    delete requests[correlationId];
                    reject(err);
                });
    });
};

module.exports.publish = publish;
module.exports.connect = connect;
module.exports.dbRequest = dbRequest;
