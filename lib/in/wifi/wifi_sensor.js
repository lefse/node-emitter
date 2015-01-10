
var wifiscanner = require('node-wifiscanner');

function scan(data, callback){
  wifiscanner.scan(function(err, d){
    if (err) {
        console.log("Error : " + err);
    }
    data.wifi_info = JSON.stringify(d);
    callback(data);
  });
}

module.exports = {
  check: scan
};


