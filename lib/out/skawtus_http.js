var rest = require('restler'),
       _ = require('underscore');

var skawtusGetUrl = "http://skawtus.com/img/z.gif";

var headers = {
  'connection': 'close',
  'user-agent': 'node-emitter',
  'Content-Type': 'application/x-www-form-urlencoded',
  'accept-encoding': 'identity'
};

function sendGet(payload, callback){

  var params = Object.keys(payload).map(function(k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(payload[k])
  }).join('&');

  var finalUrl =skawtusGetUrl+params;
  rest.get(finalUrl, {
    headers: headers
  }).on('complete', function(data, response) {
    callback({
      code: response.statusCode,
      raw: response.rawEncoded
    });
  });

}

function sendPost(payload, callback){

  //TODO

}

module.exports = {
  sendGet: function (payload, callback) {
    sendGet(payload, callback);
  },
  sendPost: function(payload, callback){
    sendPost(payload, callback);
  }
};
