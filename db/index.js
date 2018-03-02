const MongoClient = require('mongodb').MongoClient;
const rabbit = require('./utils/rabbit');
const config = require('config').get('webmthread');
let db;

const api = {
    getSources: () => Promise.resolve([{url: 'https://2ch.hk/b/catalog_num.json', description: '2ch WEBM Threads'}]),
    saveThread: () => Promise.resolve({}),
    saveVideos: () => Promise.resolve({}),
};

const onMessage = ({type, payload}, correlationId, replyTo) => {
    console.log(`Received message from RabbitMQ
    Type: ${type}
    Payload: ${JSON.stringify(payload)}`,);
    setTimeout(() => {
        if (typeof api[type] !== 'function') {
            return rabbit.publish({error: `DB has no such RPC method (${type})`}, correlationId, replyTo);
        }
        return api[type](payload).then(
            data => rabbit.publish(data, correlationId, replyTo),
            ({message}) => rabbit.publish({error: message}, correlationId, replyTo));
    }, 100);
};

const createCollections = () => db.createCollection('sources');

/**
 * Connects to the DB (sqlite@localhost)
 * @returns Promise<Db> instance
 */
const connectToDb = () => {
    const {host, port, dbName} = config.db;
    return MongoClient.connect(`mongodb://${host}:${port}`)
        .then(dataBase => dataBase.db(dbName))
        .then(instance => {
            db =instance;
            return createCollections();
        });
};

console.log("Starting Rabbit connection!");
connectToDb()
    .then(()=>rabbit.connect(onMessage))
    .then(() => {
        console.log("RabbitMQ and DB Connection established");
    }, (err) => {
        console.log("RabbitMQ Connection errored with", err);
    });