const amqp = require('amqplib');
const url = require('url');
const uuid = require('uuid/v1');

const config = require('config').get('webmthread').get('rabbitMQ');

let connectionPromise;

const subscribeToExchange = (channel, exchangeName, exchangeType, routingKey, callback, queueOptions = {}) =>
    channel.assertExchange(exchangeName, exchangeType)
        .then(()=> channel.assertQueue(null, {durable: false, autoDelete: true, ...queueOptions}))
        .then(({queue}) => {
            return channel.bindQueue(queue, exchangeName, routingKey)
                .then(() => {
                    if (callback) {
                        channel.consume(queue, callback, {noAck: true});
                    }
                    return queue;
                });
        });

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
                subscribe: ({name: exchangeName, type: exchangeType = 'fanout', onMessage, options: queueOptions}) => {
                    return subscribeToExchange(channel, exchangeName, exchangeType, channelRoutingKey, parseRabbitMessage(onMessage), queueOptions);
                },
                publish: ({name: exchangeName, type: exchangeType = 'fanout'}) => {
                    return channel.assertExchange(exchangeName, exchangeType)
                        .then(() => (payload, correlationId = uuid(), replyTo = '', routingKey = channelRoutingKey) => {
                            const result = channel.publish(exchangeName, routingKey, new Buffer(JSON.stringify(payload)), {
                                deliveryMode: 2,
                                contentType: 'application/json',
                                correlationId,
                                replyTo
                            });
                            console.log(`Published to exchange ${exchangeName} (type '${exchangeType}') 
                                            with routingKey ${routingKey}
                                            with correlationId ${correlationId}
                                            with replyTo ${replyTo}
                                            with data ${JSON.stringify(payload)}
                                            with result ${result}`);
                            return Promise.resolve(result);
                        })
                },
                rpc: ({request: requestExchange, response: responseExchange}) => {
                    return subscribeToExchange(channel, responseExchange, 'topic', channelRoutingKey, (message) => {
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
                        .then(() => retObj.publish({name: requestExchange}))
                        .then((publishFn) => (method, payload) => {
                            return new Promise((resolve, reject) => {
                                const correlationId = uuid();
                                publishFn({type: method, payload}, correlationId, channelRoutingKey, '')
                                    .then(
                                        () => {
                                            requests[correlationId] = {resolve, reject};
                                        },
                                        (err) => {
                                            delete requests[correlationId];
                                            reject(err);
                                        });
                            });
                        })
                },
                getOne: (exchangeName, routingKey = '') => subscribeToExchange(channel, exchangeName, 'fanout', routingKey)
                    .then(queue => () =>
                        channel.get(queue, {noAck: true})
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
