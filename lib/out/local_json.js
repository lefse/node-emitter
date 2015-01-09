var fs = require('fs');
var append = true;
var fileName = 'skawtus.json';

function writeFile(payload, callback){

  if(append){

    fs.readFile(fileName, {encoding:'utf-8'}, function(err,data){
      if(err){
        data = [];
      } else {
        data = JSON.parse(data);
        data.push(payload);
        fs.writeFile(fileName, JSON.stringify(data), function(err,data){
          if(err){
            return console.log(err);
          }
          callback(payload);
        });
      }
    });

  } else {
    fs.writeFile(fileName, JSON.stringify([payload]), function(err,data){
      if(err){
        return console.log(err);
      }
      callback(payload);
    });
  }
}

module.exports.write = writeFile;