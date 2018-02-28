const request = require('request');
const rabbit = require('./utils/rabbit');

const onMessage = (message) => {
    console.log("Received message from RabbitMQ:", message);
};


console.log("Starting Rabbit connection!");
rabbit.connect(onMessage).then(function () {
    console.log("RabbitMQ Connection established");
    rabbit.publish({msg: '#YOLO'}).then(res => console.log(res), err => console.error(err));
}, (err) => {
    console.log("RabbitMQ Connection errored with", err);
});