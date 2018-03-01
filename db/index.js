const Sequelize = require("sequelize");
const rabbit = require('./utils/rabbit');
const config = require('config').get('webmthread');
const models = {};
let sequelize;

const onMessage = (models) => ({type, payload}) => {
    console.log(`Received message from RabbitMQ
    Type: ${type}
    Payload: ${JSON.stringify(payload)}`, );
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
 * @param [withClear] If true, this will purge the data in the DB.
 */
createModels = (withClear = true) => { //TODO: Change withClear to `false` when ready for production
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
        .map(key => models[key].sync({force: (withClear)})))
        .then(()=>models);
};

console.log("Starting Rabbit connection!");
connectToDb()
    .then(sequelizeInstance => {
        console.log("DB Connection instantiated");
        sequelize = sequelizeInstance;
        createModels(sequelizeInstance);
        return rabbit.connect(onMessage);
    })
    .then(() => {
        console.log("RabbitMQ and DB Connection established");
    }, (err) => {
        console.log("RabbitMQ Connection errored with", err);
    });