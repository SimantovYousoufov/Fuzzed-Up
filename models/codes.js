// Import mongoose
var mongoose = require('mongoose');

module.exports = mongoose.model('Codes', {
    encoded: [{ content: String, decoded: String }],
    encMethod: String
});