var com = require("serialport");
var nmea = require("nmea");


function check(data, callback) {
	gpsObject = nmea.parse("$GPGGA,172814.0,3723.46587704,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031*4F");
	var serialPort = new com.SerialPort("/dev/ttyUSB0", {
	    baudrate: 4800,
	    parser: com.parsers.readline('\r\n')
	});
	serialPort.open(function (error) {
		if ( error ) {
			console.log('failed to open: '+error);
		} else {
			console.log('Port open');
			serialPort.flush(callback);
			serialPort.on('data', function(gpsData) {
				if(gpsData.toString().substring(0,6) === "$GPGGA") {
					try {
						gpsObject = nmea.parse(gpsData);	
					} catch(ex) {
						//Do something??
					}		
					serialPort.on('close', function(error));	
					data.gps = JSON.stringify(gpsObject);	
					//console.log(data.gps);
					callback(data);									
				}
			});
		}
	});
}

module.exports = {
   check: check
};
