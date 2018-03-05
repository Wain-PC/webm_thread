const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const rabbit = require('rabbit');
const config = require('config').get('webmthread');
let db, collections = {};

const api = {
    getSources: () => collections.sources.find()
        .project({ _id: 1, displayName: 1 })
        .toArray(),
    addSource: (source) => collections.sources.updateOne({url: source.url}, {$set: source}, {upsert: true})
        .then(()=>collections.sources.findOne({url: source.url}, {threads: 0})),
    addThreads: ({sourceId, threads}) => collections.sources.updateOne({_id: ObjectId(sourceId)}, {$set: {threads}}, {upsert: true}),
    getThreads: ({sourceId}) => collections.sources.findOne({_id: ObjectId(sourceId)}).then(item => item.threads.map(({videos, ...rest})=>rest)),
    getThread: ({sourceId, threadId}) => collections.sources.findOne({_id: ObjectId(sourceId), "threads.id": +threadId}, {threads: 1})
        .then(({threads})=>threads.filter(t=>t.id === +threadId)[0]),
    removeThread: ({url}) => collections.sources.removeOne({"threads.url": url}),
    addVideos: ({url, videos}) => collections.sources.updateOne({"threads.url": url}, {$set: { "threads.$.videos": videos}}),
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

const createSourceCollection = () => db.createCollection('sources');

/**
 * Connects to the DB (sqlite@localhost)
 * @returns Promise<Db> instance
 */
const connectToDb = () => {
    const {host, port, dbName} = config.db;
    return MongoClient.connect(`mongodb://${host}:${port}`)
        .then(dataBase => dataBase.db(dbName))
        .then(instance => {
            db = instance;
            return createSourceCollection();
        })
        .then(sourcesCollection => {
            collections.sources = sourcesCollection;
        });
};

console.log("Starting Rabbit connection!");
connectToDb()
    .then(() => rabbit.connect(onMessage))
    .then(() => {
        console.log("RabbitMQ and DB Connection established");
    }, (err) => {
        console.log("RabbitMQ Connection errored with", err);
    });