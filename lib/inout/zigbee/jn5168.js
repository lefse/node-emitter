var com = require("serialport"),
	_ = require('underscore'),
    pubsub = require('node-internal-pubsub'),
    publisher  = pubsub.createPublisher();

var zigbeePortOpen = false;

var jnDevice = {
    port: "/dev/ttyUSB1",
    baudrate: 115200,
	dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false	   
}

var commandAT =
{
	ATRB: 0x30, // reboot
	ATPA: 0x32, // power up action
	ATAJ: 0x34, // Auto Join Network
	ATRS: 0x36, // Re-Scan Network
	ATLN: 0x38, // List scanned network
	ATJN: 0x40, // Join specified Network
	ATLA: 0x42, // List All nodes
	//Data Transmit command
	ATTM: 0x44, // Transmit mode
	ATDA: 0x46, // Unicast Address
	ATQT: 0x48, // Query Chip temperature
	ATIO: 0x50, //Handle IOs
	ATIF: 0x52 // Node information
}

var jnSerialPort = new com.SerialPort(jnDevice.port, {
    baudrate: jnDevice.baudrate,
	dataBits: jnDevice.dataBits,
    parity: jnDevice.parity,
    stopBits: jnDevice.stopBits,
    flowControl: jnDevice.flowControl,	    
    parser: com.parsers.readline('\r\n')
});	

jnSerialPort.open(function (error) {
	if ( error ) {			
		console.log("failed to open zigbee port: " + error);										
	} else {
		zigbeePortOpen = true;
		console.log('Port open');
		jnSerialPort.on('data', function(jnData) {	
			// publish returned message
			publisher.publish('zigbee', jnData);
		});

		jnSerialPort.on('close', function(){
			//console.log('GPS PORT CLOSED');
			zigbeePortOpen = false;
			callback(data);		
		});

		jnSerialPort.on('error', function (err) {
			console.error("Zigbee Port ERROR: ", err);  	
			callback(data);	
		});
	}
});

function info(data, callback) {
	if(zigbeePortOpen) {
		console.log("writing to port");
		jnSerialPort.write("ATIF\r", function () {
    		jnSerialPort.drain(callback);
  		});
	}
	callback(data);
}

module.exports = {
   info: info
};