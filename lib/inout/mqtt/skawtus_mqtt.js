var mqtt = require('mqtt'),
	url = require('url'),
    pubsub = require('node-internal-pubsub'),
    publisher  = pubsub.createPublisher();

var mqtt_url = url.parse("mqtt://brent:password@0.0.0.0:1883");

var client = mqtt.createClient(mqtt_url.port, mqtt_url.hostname, {
	//clientId: 'mqtt-skawtus',
	username: mqtt_url.username,
	password: mqtt_url.password
});

client.on('connect', function() {
	console.log("Connecting to host: " + mqtt_url.hostname + ":" + mqtt_url.port);
	client.subscribe('skawtus/usr/devices/relay/value/set');
		client.on('message', function(topic, message) {
			publisher.publish('mqtt', {topic: topic, msg: String(message)});
	});	
});


function publish(payload){
	// publish a message to a topic
	client.publish('skawtus/usr/', 'my message', function() {
		//console.log("This is an MQTT publish.");
	});	
}

module.exports = {
   publish: publish
};
