// Import mongoose
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var statisticSchema = new Schema({
    character: String,
    count: Number
});

module.exports = mongoose.model('Statistic', statisticSchema);