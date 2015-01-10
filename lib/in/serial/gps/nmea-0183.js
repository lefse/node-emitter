
var com = require("serialport");
var nmea = require("nmea");
var _ = require('underscore');

var gpsDevice = {
    port: "/dev/ttyUSB0",
    baudrate: 4800,
	dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false	   
}

function check(data, callback) {
	var gpsSerialPort = new com.SerialPort(gpsDevice.port, {
	    baudrate: gpsDevice.baudrate,
		dataBits: gpsDevice.dataBits,
	    parity: gpsDevice.parity,
	    stopBits: gpsDevice.stopBits,
	    flowControl: gpsDevice.flowControl,	    
	    parser: com.parsers.readline('\r\n')
	});	
	var gpsObject = nmea.parse("$GPGGA,164518.881,,,,,0,00,,,M,0.0,M,,0000*58");
	gpsSerialPort.open(function (error) {
		if ( error ) {			
			console.log('failed to open: '+error);
			try {
				gpsObject = nmea.parse(gpsData);		
			} catch(ex) {
				//Do something??
			}			
			data.gps = JSON.stringify(nmeaFilter(gpsObject));	
			callback(data);										
		} else {
			//console.log('Port open');
			gpsSerialPort.on('data', function(gpsData) {			
				if(gpsData.toString().substring(0,6) === "$GPGGA") {
					try {
						gpsObject = nmea.parse(gpsData);	
					} catch(ex) {
						//Do something??
					}		
						gpsSerialPort.close(function (error) {
							if(error)
								console.log('gps port closed', err);
						});					
						data.gps = JSON.stringify(nmeaFilter(gpsObject));	
						callback(data);										
					}
			});
		}
	});

  gpsSerialPort.on('close', function(){
    //console.log('GPS PORT CLOSED');
	callback(data);		
  });

  gpsSerialPort.on('error', function (err) {
    console.error("GPS PORT ERROR", err);  
	callback(data);	
  });
}

function nmeaFilter(data) {
	// GPGGA message contains these values.
	// Omit uncommented members.
	return (_.omit(data, 
		//"sentence",
		"type",
		//"timestamp",
		//"lat",
		//"latPole",
		//"lon",
		//"lonPole",
		"fixType",
		"numSat",
		"horDilution",
		//"alt",
		//"altUnit",
		"geoidalSep",
		"geoidalSepUnit",
		"differentialAge",
		"differentialRefStn",
		"talker_id"
	));
}

module.exports = {
   check: check
};
