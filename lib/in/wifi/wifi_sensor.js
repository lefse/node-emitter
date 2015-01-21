
var wifiscanner = require('node-wifiscanner');

function scan(data, publisher, callback){
  wifiscanner.scan(function(err, d){
    if (err) {
        console.log("Error : " + err);
    }
    data.wifi_info = JSON.stringify(d);
    publisher.publish('wifi', data.wifi_info);
    callback(data, publisher);
  });
}

module.exports = {
  check: scan
};


