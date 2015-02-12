var fs = require('fs');
var http = require('http');

module.exports = {
    goal: 'Elegantly unscramble this message using the space provided. Then write the scrambler that made it. The answer is an object with global scope that can scramble and unscramble any text any number of times.',
    /**
     * Retrieve HTML from the specified url
     *
     * @param url
     * @param callback
     */
    getCode: function(url, callback) {
        http.get(url, function(response) {
            var body = '';
            // Get html body
            response.on('data', function(htmlBody) {
                body += htmlBody;
            });

            // Call callback
            response.on('end', function() {
                callback(body);
            });
        }).on('error', function() {
            callback(null);
        })
    },
    widthCount: 1, // Keep a global count of characters to create the proper block width
    /**
     *
     * @param {string} useChars Characters to use for garbage
     * @param {int} min Minimum spacing between secret characters
     * @param {int} max Maximum spacing between secret characters
     * @param {int} Width Width of scrambled block
     * @returns {string} string Randomized characters
     */
    garbageString: function(useChars, min, max, width) {
        /**
         * Math.floor will give all possibilities an equal chance to be picked,
         * Math.round will have result in the min and max having half the chance to be rolled
         */
        var numberOfChars = Math.floor(Math.random() * (max - min) + min);

        var string = '';
        for (var i = 0; i <= numberOfChars; i++) {
            string += '<span>';
            string += useChars.charAt(Math.floor(Math.random() * useChars.length));
            string += '</span>';

            if (this.widthCount % width === 0) {
                string += '<br>';
            }
            this.widthCount++;
        }
        return string;
    },
    /**
     * Check if this exists in an array
     *
     * @param needle
     * @param haystack
     * @returns {boolean}
     */
    inArray: function(needle, haystack) {
        return haystack.indexOf(needle) > -1; // False if not in haystack
    },
    /**
     * Assign default options or set to request parameters
     *
     * @param {object} reqBody Request object (req.body)
     * @returns {object} Options object
     */
    setOptions: function(reqBody) {
        return {
            scrambleThis: reqBody.to_scramble || this.goal,
            superSecretChars: reqBody.use_chars || '012345679ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*():/',
            minSpacing: reqBody.minSpacing || 10,
            maxSpacing: reqBody.maxSpacing || 20,
            selector: reqBody.selector || 'body',
            width: reqBody.width || 50
        };
    },
    /**
     * Load the selected .json file
     *
     * @param {string} file Filename to load
     * @returns {object} Parsed JSON object
     */
    getStats: function(file) {
        var statsFile = __dirname + '/../database/'+file+'.json';
        return JSON.parse(fs.readFileSync(statsFile)); // Don't need to specify encoding
    },
    /**
     * Write to the stats file
     *
     * @param {string} file Filename to write
     * @param {string} data JSON Stringified object
     */
    writeStats: function(file, data) {
        var statsFile = __dirname + '/../database/'+file+'.json';
        fs.writeFile(statsFile, data, function(err) {
            if (err) throw err;
            console.log('file saved');
        })
    }
};