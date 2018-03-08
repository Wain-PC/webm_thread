const exec = require('child_process').exec;
const path = require('path');
const mkdirp = require('mkdirp');
const fileExists = require('file-exists');
const rabbit = require('rabbit');
const config = require('config').get('webmthread');

let getOneMessage;
const run = () => getOneMessage()
    .then(toGif, (err)=>new Promise((resolve, reject)=>setTimeout(()=>reject(err), 1000)))
    .then(
        () => {
            console.log('GIF created sucessfully, checking for the next one');
            setTimeout(run, 0);
        }, (err) => {
            console.log(err.message || err);
            setTimeout(run, 0);
        });
const toGif = ({content: {url, displayName}}) => new Promise((resolve, reject) => {
    //Step 1. Split url into pieces
    const arr = url.split('/');
    const filePath = path.resolve(config.webm2gif.storagePath, arr.slice(2, -1).join('/'));
    const fileName = arr.slice(-1)[0];
    const fullPath = `${filePath}/${fileName}.gif`;
    //Step 2. Check whether this filename already exists.
    fileExists(fullPath).then(exists => {
        if(exists) {
            return reject(new Error(`Gif already exists for webm `))
        }
        console.log('Received new video:', filePath, fileName, displayName);
        //Step 3. Create appropriate folders, if none.
        return mkdirp(filePath, err => {
            if(err) {
                return reject(err);
            }
            //Step 4. Convert and save video into the desired folder.
            return exec(`bash ./gifenc.sh ${url} ${fullPath}`, (error, stdout, stderr) => error ? reject(stderr) : resolve(stdout));
        });
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
