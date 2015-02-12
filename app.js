// Modules
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var port = process.env.PORT || 8080;

// To get body of POST
app.use(bodyParser.json());
//app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('X-HTTP-Method-Overrise'));

// Set static files location
app.use(express.static(__dirname + '/public'));

// Routes
require('./routes')(app);

// Start app at above port
app.listen(port);
console.log('We\'re using port ' + port);

exports = module.exports.app = app;