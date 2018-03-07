const amqp = require('amqplib');
const url = require('url');
const uuid = require('uuid/v1');

const config = require('config').get('webmthread').get('rabbitMQ');

let connectionPromise;

const subscribeToExchange = (channel, exchangeName, routingKey, callback, queueOptions = {}) => {
    channel.assertExchange(exchangeName, 'fanout');
    return channel.assertQueue(null, {durable: false, autoDelete: true, ...queueOptions})
        .then(({queue}) => {
            return channel.bindQueue(queue, exchangeName, routingKey)
                .then(() => {
                    if (callback) {
                        channel.consume(queue, callback, {noAck: true});
                    }
                    return queue;
                });
        });
};

const connectionInitialize = (url) => amqp.connect(url)
    .catch((err) => new Promise(resolve => {
        console.log(`Rabbit is unavailable (${err}), waiting to try again in ${config.reconnectTimeout / 1000} seconds `);
        setTimeout(() => resolve(connectionInitialize(url)), config.reconnectTimeout);
    }));

const parseRabbitMessage = callback => (message) => {
    const {content, properties: {correlationId, replyTo}} = message;
    const output = {
        content: JSON.parse(content.toString("utf-8")),
        correlationId,
        replyTo
    };
    if (callback) {
        return callback(output.content, correlationId, replyTo);
    }
    return output;
};

/*
* */
const connect = () => {
    const channelRoutingKey = uuid();
    //TODO: Rewrite using memcached
    const requests = {};
    if (!connectionPromise) {
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
        connectionPromise = connectionInitialize(connectionURL);
    }
    return connectionPromise
        .then(connection => connection.createChannel())
        .then((channel) => {
            const retObj = {
                subscribe: (exchangeName, onMessage, queueOptions) => {
                    return subscribeToExchange(channel, exchangeName, channelRoutingKey, parseRabbitMessage(onMessage), queueOptions);
                },
                publish: (exchangeName, exchangeType = 'fanout') => {
                    return channel.assertExchange(exchangeName, exchangeType)
                        .then(() => (payload, routingKey = '', correlationId = uuid(), replyTo = '') => {
                            channel.publish(exchangeName, routingKey, new Buffer(JSON.stringify(payload)), {
                                deliveryMode: 2,
                                contentType: 'application/json',
                                correlationId,
                                replyTo
                            }).then(() => {
                                console.log(`Published to exchange ${exchangeName} (type '${exchangeType}') 
                                            with routingKey ${routingKey}
                                            with correlationId ${correlationId}
                                            with data ${JSON.stringify(payload)}`);
                            })
                        })
                },
                rpc: (requestExchange, responseExchange) => {
                    return subscribeToExchange(channel, requestExchange, channelRoutingKey, (message) => {
                        const {content, properties: {correlationId}} = message;
                        console.log(`Received RPC response with corrId ${correlationId}`);
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
                    })
                        .then(() => retObj.publish(responseExchange, 'topic'))
                        .then((publishFn) => {
                            return {
                                call: (method, payload) => {
                                    return new Promise((resolve, reject) => {
                                        const correlationId = uuid();
                                        publishFn(payload, '', correlationId, channelRoutingKey)
                                            .then(
                                                () => {
                                                    requests[correlationId] = {resolve, reject};
                                                },
                                                (err) => {
                                                    delete requests[correlationId];
                                                    reject(err);
                                                });
                                    });
                                }
                            }
                        })
                },
                getOne: (exchangeName, routingKey = '') => subscribeToExchange(channel, exchangeName, routingKey)
                    .then(queue => () =>
                        channel.get(queue)
                            .then(msg => {
                                if (msg === false) {
                                    throw new Error('Nothing to get, queue is empty');
                                }
                                return msg;
                            })
                            .then(parseRabbitMessage()))
            };
            return retObj;
        })
};

module.exports.connect = connect;
