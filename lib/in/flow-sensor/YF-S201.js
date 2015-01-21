
var check_period = 500;

var mock_flow = true;
var mock_count = 27;

var sensor_0_gpio = 18;
var sensor_1_gpio = 19;
var sensor_2_gpio = 20;

var states = [
  {
    id: sensor_0_gpio,
    count: 0,
    millis: 0,
    pouring: false
  },
  {
    id: sensor_1_gpio,
    count: 0,
    millis: 0,
    pouring: false
  },
  {
    id: sensor_2_gpio,
    count: 0,
    millis: 0,
    pouring: false
  }
];

if( mock_flow ){
  function pouring_mock(c){
    count = [c,c*.75,c*.125];
    states[0].pouring = false;
    states[0].count = c;
    states[1].pouring = false;
    states[1].count = c*0.75;
    states[2].pouring = false;
    states[2].count = c*1.25;
    setTimeout(pouring_mock,check_period,mock_count);
  }
  setTimeout(pouring_mock,check_period,mock_count);
} else {
  var Gpio = require('onoff').Gpio,
      sensor0 = new Gpio(states[0].id, 'in', 'both'),
      sensor1 = new Gpio(states[1].id, 'in', 'both'),
      sensor2 = new Gpio(states[2].id, 'in', 'both');

  function pouring_check(c,id){
    states[id].pouring = (c != states[id].count);
  }
  
  sensor0.watch(function(err, value) {
    if (err) exit();
    if( value ){
      states[0].count++;
      setTimeout(pouring_check,check_period,count,0);
    }
  });  
  
  sensor1.watch(function(err, value) {
    if (err) exit();
    if( value ){
      states[1].count++;
      setTimeout(pouring_check,check_period,count,1);
    }
  });  

  sensor2.watch(function(err, value) {
    if (err) exit();
    if( value ){
      states[2].count++;
      setTimeout(pouring_check,check_period,count,2);
    }
  });  

  process.on('SIGINT', exit);
}

function exit() {
    process.exit();
}

function milliliters(count) {
  return count * 2.25;
}

function check(data, publisher, callback){
  states.forEach( function(state){
    if( state.pouring )
      state.millis = null;
    else{
      state.millis = milliliters(state.count);
      state.count = 0;
    }
  });
  data.flow_sensor = JSON.stringify(states);
  publisher.publish('flow-sensor', data.flow_sensor);
  callback(data, publisher);
  callback(data);
}

module.exports = {
  check: check
};


