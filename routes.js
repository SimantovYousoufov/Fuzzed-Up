var express = require('express');
// Require controllers
var fuzzController = require('./controllers/fuzz');

module.exports = function(app) {
    app.get('/decode', fuzzController.decode);

    app.post('/scramble', fuzzController.scramble);

    app.get('/secret', fuzzController.scramble);

    app.get('/pattern', fuzzController.getPattern);

    app.get('/data', fuzzController.data);
};