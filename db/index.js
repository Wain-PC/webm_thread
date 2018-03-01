const Sequelize = require("sequelize");
const rabbit = require('./utils/rabbit');
const config = require('config').get('webmthread');

const api = (models, type, payload) => {
    switch (type) {
        case 'getLatestId': {
            return thread.max();
        }
    }
};

const onMessage = (models) => ({type, payload}) => {
    console.log(`Received message from RabbitMQ
    Type: ${type}
    Payload: ${JSON.stringify(payload)}`, );
    return api(models, type, payload).then(result => rabbit.publish(result));
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
 * @param sequelize Sequelize instance.
 * @param [withClear] If true, this will purge the data in the DB.
 */
createModels = (sequelize, withClear = false) => {
    const models = {};
    models.thread = sequelize.define('thread', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        files: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        }
    });

    return Promise.all(Object.keys(models).map(key => models[key].sync({force: (withClear)})));
};

console.log("Starting Rabbit connection!");
connectToDb()
    .then(sequelizeInstance => {
        console.log("DB Connection instantiated");
        return createModels(sequelizeInstance);
    })
    .then(sequelizeInstance => rabbit.connect(onMessage(sequelizeInstance)))
    .then(() => {
        console.log("RabbitMQ Connection established");
    }, (err) => {
        console.log("RabbitMQ Connection errored with", err);
    });