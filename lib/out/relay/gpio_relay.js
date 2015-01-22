var mock_relay = true;

if( mock_relay ){

} else {
  var Gpio = require('onoff').Gpio,
     relay = new Gpio(23, 'out');

  function on(){
    if(!mock_relay)
      relay.writeSync(0);
  }

  function off(){
    if(!mock_relay)
      relay.writeSync(1);
  }

  process.on('SIGINT', exit);
}

function exit() {
    process.exit();
}

module.exports = {
  on: on,
  off: off
};