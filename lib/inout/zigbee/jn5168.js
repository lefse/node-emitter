var com 	= require("serialport"),
	_ 		= require('underscore');
	Struct 	= require('struct');

var meshbeePortOpen = false;

var jnDevice = {
    port: 			"/dev/ttyUSB2",
    baudrate: 		115200,
	dataBits: 		8,
    parity: 		'none',
    stopBits: 		1,
    flowControl: 	false  
}

var API_FRAME_START = 0x7E
var AT_LOCAL_REQUEST_ID = 0x08;
var API_DATA_LEN = 20

// Digital pins
var API_ID = 
{
	LOCAL_AT_REQ:   0x08,
	LOCAL_AT_RES:   0x88,
	REMOTE_AT_REQ:  0x17,
	REMOTE_AT_RES: 	0x97,
	DATA_PACKET: 	0x02,
	TOPO_REQ: 		0xFB,
	TOPO_RES: 		0x6B,
}

// API mode index
var API_INDEX =
{
    ATRB: 0x30,  // reboot
    ATPA: 0x32,  // power up action, for coo:powerup re-form the network; for rou:powerup re-scan networks
    ATAJ: 0x34,  // for rou&end, auto join the first network in scan result list
    ATRS: 0x36,  // re-scan radio channels to find networks
    ATLN: 0x38,  // list all network scaned
    ATJN: 0x40,  // network index which is selected to join,MAX_SINGLE_CHANNEL_NETWORKS: 8
    ATRJ: 0x41,  // rejoin the last network
    ATLA: 0x42,  // list all nodes of the whole network, this will take a little more time
    ATTM: 0x44,  // tx mode, 0:  broadcast; 1: unicast
    ATDA: 0x46,  // unicast dst addr
    ATBR: 0x48,  // baud rate for uart1
    ATQT: 0x50,  // query on-chip temperature
    ATQV: 0x52,  // query on-chip voltage
    ATIF: 0x54,  // show information of the node
    ATAP: 0x56,  // enter API mode
    ATEX: 0x58,  // exit API mode,end data mode
    ATOT: 0x60,  // ota trigger, trigger upgrade for unicastDstAddr
    ATOR: 0x62,  // ota rate, client req period
    ATOA: 0x64,  // ota abort
    ATOS: 0x66,  // ota status poll
    ATTP: 0x68,  // for test
    ATIO: 0x70,  // set IOs
    ATAD: 0x72   // read ADC value from AD1 AD2 AD3 AD4
}

// Digital pins
var DIO_pins = 
{
	D0:   0x00,
	D1:   0x01,
	D2:   0x02,
	D3:   0x03,
	D4:   0x04,
	D5:   0x05,
	D6:   0x06,
	D7:   0x07,
	D8:   0x08,
	D9:   0x09,
	D10:  0x0A,
	D11:  0x0B,
	D12:  0x0C,
	D13:  0x0D,
	D14:  0x0e,
	D15:  0x0f,
	D16:  0x10,
	D17:  0x11,
	D18:  0x12,
	D19:  0x13,
	D20:  0x14,
	DO0:  0x21,
	DO1:  0x22	
}

// Digital pins
var DIO_dir = 
{
	read: 	0x01,
	write:  0x00
}

// Digital pins
var DIO_val = 
{
	low: 	0x00,
	high:  	0x01
}

// Analog Pins
var analog_pins =
{
	A1:  	0x00,
	A2:  	0x01,
	A3:  	0x02,
	A4:  	0x03,
	TEMP:  	0x04,
	VOL :  	0x05,
}

// GPIO Response
var GPIO = 
{
	type: 		"GPIO",
	uni_add: 	0x00,
	pin:  		0xff,
	dir:  		0x00,
	val:  		0x00
}

///////////////////////////////////////////////////////////////////
// API Frame
var API_frame = Struct()
	.word8('startDelim')
	.word8('len')
	.word8('idAPI')	

API_frame.allocate();

// Local request
var API_local_REQ = Struct()
	.word8('frame_id')
	.word8('AT_index')
	.array('param_value', 8, 'word8')  //8 bytes for request
	.word8('checksum')

API_local_REQ.allocate();

// Localresponse
var API_local_RES = Struct()
	.word8('frame_id')
	.word8('AT_index')
	.word8('status') // Used for response only
	.array('param_value', 20, 'word8')  //8 bytes for request
	.word8('checksum')

API_local_RES.allocate();

// Remote request
var API_remote_REQ = Struct()
	.word8('frame_id')
	.word8('option')
	.word8('AT_index')
	.array('param_value', 6, 'word8')  //8 bytes for request
//	.array('unicast_add', 2, 'word8')
	.word8('checksum')

API_remote_REQ.allocate();

// Remote response
var API_remote_RES = Struct()
	.word8('frame_id')
	.word8('option')
	.word8('AT_index')
	.word8('status')
	.array('param_value', 20, 'word8')  //20 bytes for response
	.array('unicast_add', 2, 'word8')
	.word8('checksum')

API_remote_RES.allocate();
///////////////////////////////////////////////////////////////

var jnSerialPort = new com.SerialPort(jnDevice.port, {
    baudrate: jnDevice.baudrate,
	dataBits: jnDevice.dataBits,
    parity: jnDevice.parity,
    stopBits: jnDevice.stopBits,
    flowControl: jnDevice.flowControl,	    
    parser: com.parsers.raw
	//parser: com.parsers.readline('\r\n')
});	

jnSerialPort.open(function (error) {
	var packet = new Buffer(0);
	var pack_ind = 256;
	var pack_len = 0;

	if ( error ) {			
		console.log("failed to open meshbee port: " + error);										
	} else {
		meshbeePortOpen = true;
		console.log('meshbee port open');

		// Parse incoming packet.
		jnSerialPort.on('data', function(buffer) {
		    for(var i=0; i < buffer.length; i++) {
		      pack_ind += 1;     

		      if(buffer[i] == API_FRAME_START) {
		        // Detected beginning of API frame.
		        pack_ind = 0;
		        pack_len = 0;
		        packet = [];
		      }
		      if(pack_ind == 1) {
		        pack_len = buffer[i]; // First byte is length.  Last byte is checksum
		      }

		      // Push bytes into packet buffer.
		      if((pack_len > 0) && (pack_ind > 1) && (packet.length < pack_len+1)) {
		        packet.push(buffer[i]);
		      }

		      // Last byte is checksum.
		      if((pack_len > 0) && (pack_ind == pack_len + 3)) {
		        //Get the chesksum byte and process the response.
		        packet.push(buffer[i]);
		        api_process(packet);
		      }
		    }
		});

		jnSerialPort.on('close', function(){
			meshbeePortOpen = false;
			callback(data);		
		});

		jnSerialPort.on('error', function (err) {
			console.error("Zigbee Port ERROR: ", err);  	
			callback(data);	
		});
	}
});

// Calculate Checksum
function calcChecksum(buf, start_ind, stop_ind) {
	var cs = 0;
	for(var i = start_ind; i < stop_ind; i++) {
	 	cs += buf[i];
	}
	return (0xFF & cs);	
}

// Zigbee GPIO request for local or remote end point.
function api_gpio_req(unicast_add, pin, dir, val) {

	var APIframe = API_frame.fields;
	var bufAPIframe = API_frame.buffer();
	var cs = 0;

	// Set start delimiter for API frame.
	APIframe.startDelim = API_FRAME_START;

	// Local specifics
	if((unicast_add[0] == 0) && (unicast_add[1] == 0)) {
		var APIreq = API_local_REQ.fields;
		var bufAPIreq = API_local_REQ.buffer();
		APIframe.idAPI = API_ID.LOCAL_AT_REQ;
		APIreq.frame_id = 0xEC;
	} 
	else  // Remote specifics
	{ 
		var APIreq = API_remote_REQ.fields;
		var bufAPIreq = API_remote_REQ.buffer();
		APIframe.idAPI = API_ID.REMOTE_AT_REQ;
		APIreq.frame_id = 0xEC;
		APIreq.option = 0;
	}

	// Set common parameters.
	APIreq.AT_index = API_INDEX.ATIO;
	APIreq.param_value[0] = dir;
	APIreq.param_value[1] = DIO_pins.D13;	
	APIreq.param_value[2] = (val & 0x1);
	APIreq.param_value[3] = 0;	
	APIreq.param_value[4] = unicast_add[0];
	APIreq.param_value[5] = unicast_add[1];
	APIframe.len = bufAPIreq.length-1;	

	// Calculate Checksum
	APIreq.checksum  = calcChecksum(bufAPIreq, 0, (bufAPIreq.length-1));

	// Build the API message.
	var ATmsg = new Buffer(bufAPIframe.length + bufAPIreq.length);
	for(i=0;i<bufAPIframe.length;++i)
		ATmsg[i] = bufAPIframe[i];
	for(i=0;i<bufAPIreq.length;++i)
		ATmsg[bufAPIframe.length + i] = bufAPIreq[i];

	// Send the API message.
	if(meshbeePortOpen) {
		jnSerialPort.write(ATmsg, function (error, results) {
			console.log(ATmsg);
    		jnSerialPort.drain();
  		});
	}
}



// Zigbee process the received API packet.
function api_process(response) {
	var msg_local_res 	= API_local_RES.fields;
	var APIframe 		= API_frame.fields;
	var b 				= new Buffer(response.length)

	// Clear response buffer
	for(i=0;i<response.length;++i) {
		b[i] = response[i];
	}

	// Set the frame portion of response
	APIframe.idAPI = response[0];

	// Set the api response portion
	var bufLocal = API_local_RES.buffer();

	// Calculate Checksum
	var checkSum = calcChecksum(response, 1, (response.length-2));

	if(checkSum == response[(response.length-1)]) {
		//console.log("Checksum match!");
		GPIO.uni_add = response[5];
		GPIO.uni_add |= response[4]<<8;
		GPIO.pin = response[16];
		GPIO.dir = response[15];
		GPIO.val = response[17];
		console.log(JSON.stringify(GPIO));
		
		// publish processed message
		try {
			publisher.publish('zigbee', JSON.stringify(GPIO));
		}
		catch(ex) {
			console.log("Error: publishing to zigbee!");
		}		
	}
}


function api_send(data, callback) {
	var uni_add = new Buffer(2);
	uni_add[0] = 0xb7;
	uni_add[1] = 0x9b;
	api_gpio_req(uni_add, DIO_pins.D13, DIO_dir.write, DIO_val.low);
}

module.exports = {
  APIsend: api_send
};

