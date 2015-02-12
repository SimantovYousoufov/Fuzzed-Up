var Codes = require('../models/codes');
var Statistic = require('../models/statistic');
var http = require('http');
var cheerio = require('cheerio');

var fs = require('fs');

var goal = 'Elegantly unscramble this message using the space provided. Then write the scrambler that made it. The answer is an object with global scope that can scramble and unscramble any text any number of times.';

// Utility functions
function getCode(url, callback) {
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
}

var widthCount = 1;
function garbageString(useChars, min, max, width) {
    // Math.floor will give all possibilities an equal chance to be picked, Math.random will have half the chance of min/max to roll
    var numberOfChars = Math.floor(Math.random() * (max - min) + min);

    string = '';
    for (var i = 0; i <= numberOfChars; i++) {
        string += '<span>';
        string += useChars.charAt(Math.floor(Math.random() * useChars.length));
        string += '</span>';

        if (widthCount % width === 0) {
            string += '<br>';
        }
        widthCount++;
    }
    return string;
}

function inArray(needle, haystack) {
    return haystack.indexOf(needle) > -1; // False if not in haystack
}

function setOptions(reqBody) {
    return {
        scrambleThis: reqBody.to_scramble || 'This is a pretty fun quiz.',
        superSecretChars: reqBody.use_chars || '012345679ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*():/',
        blockWidth: reqBody.width || 50,
        minSpacing: reqBody.minSpacing || 10,
        maxSpacing: reqBody.maxSpacing || 20,
        selector: reqBody.selector || 'body',
        width: reqBody.width || 50
    };
}

var statsFile = __dirname + '/../database/stats.json';
function getStats() {
    return JSON.parse(fs.readFileSync(statsFile)); // Don't need to specify encoding
}

function writeStats(data) {
    fs.writeFile(statsFile, data, function(err) {
        if (err) throw err;
        console.log('file saved');
    })
}

exports.decode = function(req, res) {
    var url = 'http://quizzes.fuzzstaging.com/quizzes/js1';
    var selector = 'body';

    getCode(url, function(htmlBody) {
        if (htmlBody) {
            //console.log(htmlBody);

            // For dat jQuery-like API
            var $ = cheerio.load(htmlBody);

            $('br').each(function() {
                $(this).remove();
            });

            var goal = '';
            $('span[hidden]').each(function() {
                goal += $(this).text();
            });
            $(selector).prepend('<div>'+goal+'</div>');

            // Handle hiding non-used chars
            $('span:not([hidden])').remove();

            res.send($.html());
        } else {
            res.send('Error occurred');
        }
    });
};

exports.scramble = function(req, res) {
    var options = setOptions(req.body);

    var html = '<html><' + options.selector + '>';
    var spacerCount = 0; // Position in scrambleThis string
    // while spacerCount <= scrambleThis.length
    while (spacerCount <= options.scrambleThis.length) {
        // response += <span hidden=''>scrambleThis[spacerCount]</span>
        secretLetter = '<span hidden class="secretChar">' + options.scrambleThis[spacerCount] + '</span>';
        spacerCount++;

        // rand num of chars output b/w min/max (utility function) ||
        postString = garbageString(options.superSecretChars, options.minSpacing, options.maxSpacing, options.width);

        html += secretLetter + postString;
    }
    // add end chunk of chars
    html += garbageString(options.superSecretChars, options.minSpacing, options.maxSpacing, options.width);
    html += '</' + options.selector + '></html>';

    res.send(html);
};

exports.getPattern = function(req, res) {
    var url = req.body.url || 'http://quizzes.fuzzstaging.com/quizzes/js1';
    getCode(url, function(htmlBody) {
        if (htmlBody) {
            var $ = cheerio.load(htmlBody);
            var scrambledText = '';
            var lastIndex = 0;
            var minRangeSinceLast = 1000;
            var maxRangeSinceLast = 0;

            var charsUsed = getStats();

            $('span').each(function() {
                scrambledText += $(this).text();
                if (typeof $(this).attr('hidden') != 'undefined') {
                    // Ignore br tags
                    if ($(this).is('br'))
                        lastIndex++; // Add one to ignore effect of a <br> tag on the index()

                    if ($(this).index() > 0 && minRangeSinceLast > ($(this).index() - lastIndex)) {
                        minRangeSinceLast = $(this).index() - lastIndex;
                    }

                    if (maxRangeSinceLast < ($(this).index() - lastIndex)) {
                        maxRangeSinceLast = $(this).index() - lastIndex;
                    }
                    lastIndex = $(this).index();
                } else if (!$(this).is('br')) {
                    // Lets keep stats of how often certain characters appear
                    charsUsed[$(this).text()] =
                        typeof charsUsed[$(this).text()] != 'undefined' ? // Character already set?
                        charsUsed[$(this).text()] + 1 : 1; // Add count else create a record
                }
            });
            writeStats(JSON.stringify(charsUsed, undefined, 2));

            // @TODO this significantly slows execution, why?
            //var blockWidth = $('br:nth-of-type(2)').index() - $('br:first-of-type').index();
            //console.log(blockWidth);

            res.send($.html());
        } else {
            res.send('Error occurred');
        }
    })
};

/**
 * - Do a weighted chance of fuzz characters
 * Statistics to graph:
 * - Percent chance for each character to appear: frequency of occurrence/total character occurrences
 * - Most common character
 * - Max/min garbage spacing b/w hidden spans
 * - Width of block (avg)
 * - How fun this quiz was: 10/10
 */