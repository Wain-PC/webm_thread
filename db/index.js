const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const rabbit = require('./utils/rabbit');
const config = require('config').get('webmthread');
const models = {};
let sequelize;

const api = {
    getSources: () => models.source.findAll({attributes: ['url', 'description']}),
    saveThread: thread => models.thread.findOrCreate({where: {url: thread.url}, defaults: thread}),
    saveVideos: ({threadUrl, videos}) => models.thread.findOne({
        where: {
            url: threadUrl
        }
        //TODO: Refactor batch save
    }).then(thread => thread ? Promise.all(videos.map(video => models.video.findOrCreate({
        where: {url: video.url},
        defaults: video
    }))) : [])
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

/**
 * Connects to the DB (sqlite@localhost)
 * @returns sequelize instance
 */
const connectToDb = () =>
    new Promise((resolve, reject) => {
        const {name, user, password, host, dialect, pool, storage, logging} = config.db;
        try {
            resolve(new Sequelize(name, user, password, {host, dialect, pool, storage, logging}));
        } catch (err) {
            reject(err);
        }
    });

/**
 * Creates data models in DB
 * @param [force] If true, this will purge the data in the DB.
 */
createModels = (force = false) => {
    models.source = sequelize.define('source', {
        url: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false
        },
        description: {
            type: Sequelize.STRING,
        }
    });


    models.thread = sequelize.define('thread', {
        url: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false
        }
    });

    models.video = sequelize.define('video', {
        url: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false
        },
        thumbnailUrl: {
            type: Sequelize.STRING
        },
        displayName: {
            type: Sequelize.STRING
        }
    });

    models.source.hasMany(models.thread, {onDelete: 'cascade'});
    models.thread.hasMany(models.video, {onDelete: 'cascade'});

    return Promise
        .all(Object.keys(models)
            .map(key => models[key].sync({force})))
        .then(() => models);
};

console.log("Starting Rabbit connection!");
connectToDb()
    .then(sequelizeInstance => {
        console.log("DB Connection instantiated");
        sequelize = sequelizeInstance;
        createModels();
        return rabbit.connect(onMessage);
    })
    .then(() => {
        console.log("RabbitMQ and DB Connection established");
    }, (err) => {
        console.log("RabbitMQ Connection errored with", err);
    });