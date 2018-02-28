const amqp = require('amqplib');
const url = require('url');
const uuid = require('uuid/v1');

const config = require('config').get('webmthread').get('rabbitMQ');

let channelPromise;
const channelRoutingKey = uuid();

const subscribeToExchange = (channel, callback) =>
    channel.assertQueue(null, {durable: false, autoDelete: true})
        .then(({queue}) => {
            channel.bindQueue(queue, config.exchanges.subscribe, channelRoutingKey);
            channel.consume(queue, callback, {noAck: true});
            return channel;
        });

const connectionInitialize = (url) => amqp.connect(url)
    .catch((err) => new Promise(resolve => {
        console.log(`Rabbit is unavailable (${err}), waiting to try again in ${config.reconnectTimeout/1000} seconds `);
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
            const {publish, subscribe} = config.exchanges;
            console.log("Got channel");
            if (config.exchanges.publish) {
                console.log(`Found publish ability to exchange ${publish}, creating exchange...`);
                channel.assertExchange(publish)
            }
            if (subscribe) {
                console.log(`Found subscription to exchange ${subscribe}, subscribing...`);
                return subscribeToExchange(channel, (message) => {
                    const {content} = message;
                    onMessage(JSON.parse(content.toString("utf-8")));
                });
            }
            return channel;
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

module.exports.publish = publish;
module.exports.connect = connect;
