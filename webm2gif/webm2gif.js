const exec = require('child_process').exec;
const rabbit = require('rabbit');
const config = require('config').get('webmthread');


const run = () => rabbit.get()
	.then(toGif)
	.then(
		() => {
			console.log('GIF created sucessfully, checking for the next one');
			setTimeout(run, 0);
		}, (err) => {
			console.log(err.message);
			setTimeout(run, 1000);
		})
	.then();
const toGif = ({content: {url, displayName}}) => new Promise((resolve, reject) => {
	console.log('Received new video:', url, displayName);
	return exec(`bash ./gifenc.sh ${url} ${displayName}`, (error, stdout, stderr) => error ? reject(stderr) : resolve(stdout));
});


console.log("Starting Rabbit connection!");
rabbit.connect()
	.then(() => {
		console.log("RabbitMQ and DB Connection established, starting to check queue");
		run();
	}, (err) => {
		console.log("RabbitMQ Connection errored with", err);
	});
