var Gpio = require('onoff').Gpio,
    sensor = new Gpio(18, 'in', 'both');
