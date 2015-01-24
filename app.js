var utils  = require('./lib/utils'),
    pubsub = require('node-internal-pubsub');

var default_payload = {
  device: {
    type: "ee15bcea-c04e-4152-91cf-fd6c90a79538",     //skawtus generated device guid
    account: "8fb01791-b7e6-4f41-abae-2a0cbf473d79",  //skawtus generated account 
    period: 5000                                      //skawtus generated polling period in milliseconds
  }
};

var polling_period = 5000;

var in_wifi = require('./lib/in/wifi/wifi_sensor'),
    in_flow = require('./lib/in/flow-sensor/YF-S201.js'),
    in_gps = require('./lib/in/gps/nmea-0183.js'),
    in_temp = require('./lib/in/temp/DS18B20.js'),
    inout_mqtt = require('./lib/inout/mqtt/skawtus_mqtt'),    
    inout_http = require('./lib/inout/http/skawtus_http'),
    inout_zigbee = require('./lib/inout/zigbee/jn5168.js'),
    out_local_json = require('./lib/out/log/local_json'),
    out_relay = require('./lib/out/relay/gpio_relay.js');    

var publisher  = pubsub.createPublisher(),
    sub_wifi = pubsub.createSubscriber(),
    sub_temp = pubsub.createSubscriber(),
    sub_flow = pubsub.createSubscriber(),
    sub_gps = pubsub.createSubscriber(),
    sub_mqtt = pubsub.createSubscriber(),
    sub_zigbee = pubsub.createSubscriber();

sub_wifi.subscribe('wifi');
sub_flow.subscribe('flow-sensor');
sub_gps.subscribe('gps');
sub_temp.subscribe('temp');
sub_mqtt.subscribe('mqtt');
sub_zigbee.subscribe('zigbee');

// Message events from each subscriber channel.
sub_wifi.on('message', function(channel, message) {
  //console.log("Do something with :" + channel, message);
});
sub_temp.on('message', function(channel, message) {
  //console.log("Do something with :" + channel, message);
});
sub_flow.on('message', function(channel, message) {
  //console.log("Do something with :" + channel, message);
});
sub_gps.on('message', function(channel, message) {
  //console.log("Do something with :" + channel, message);
});
sub_mqtt.on('message', function(channel, message) {
    if(message.topic == "skawtus/usr/devices/relay/value/set") {
        console.log(message.msg)
        if(message.msg == "true")   {
            console.log("Relay ON");
            out_relay.on();
        } else {
            console.log("Relay OFF");
            out_relay.off();
        }
    }
});
sub_zigbee.on('message', function(channel, message) {
  console.log(message);
});

// Check data from each sensor and publish to the channel.
function checkState(data){

  in_wifi.check(data, publisher, function(data, publisher) {});
  in_flow.check(data, publisher, function(data, publisher) {});
  in_gps.check(data, publisher, function(data, publisher) {});
  in_temp.check(data, publisher, function(data, publisher) {});
  inout_mqtt.publish(data);
  inout_zigbee.info(data, function(data) {});

  setTimeout(checkState, default_payload.device.period,{});
}

checkState({});
