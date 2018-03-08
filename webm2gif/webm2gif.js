const exec = require('child_process').exec;
const mkdirp = require('mkdirp');
const rabbit = require('rabbit');
const config = require('config').get('webmthread');

let getOneMessage;
const run = () => getOneMessage()
    .then(toGif)
    .then(
        () => {
            console.log('GIF created sucessfully, checking for the next one');
            setTimeout(run, 0);
        }, (err) => {
            console.log(err.message || err);
            setTimeout(run, 1000);
        });
const toGif = ({content: {url, displayName}}) => new Promise((resolve, reject) => {
    //Step 1. Split url into pieces
    const arr = url.split('/');
    const path = arr.slice(2, -1).join('/');
    const fileName = arr.slice(-1)[0];
    console.log('Received new video:', path, fileName, displayName);
    //Step 2. Create appropriate folders, if none.
    mkdirp(path, err => {
        if(err) {
            return reject(err);
        }
        //Step 3. Convert and save video into the desired folder.
        return exec(`bash ./gifenc.sh ${url} ${path} ${fileName}`, (error, stdout, stderr) => error ? reject(stderr) : resolve(stdout));
    });
});


console.log("Starting Rabbit connection!");
const {subscribe} = config.rabbitMQ.exchanges;
rabbit.connect()
    .then(rabbitInstance => rabbitInstance.getOne(subscribe))
    .then(subFn => {
        getOneMessage = subFn;
        console.log("RabbitMQ and DB Connection established, starting to check queue");
        run();
    }, (err) => {
        console.log("RabbitMQ Connection errored with", err);
    });
