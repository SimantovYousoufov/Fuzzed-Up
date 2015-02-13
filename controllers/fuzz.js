'use strict';

var cheerio = require('cheerio');
var utility = require('./utility');

var goal = 'Elegantly unscramble this message using the space provided. Then write the scrambler that made it. The answer is an object with global scope that can scramble and unscramble any text any number of times.';

/**
 * Decodes the Fuzzed up message
 *
 * @param req
 * @param res
 */
exports.decode = function(req, res) {
    var url = req.query.url || 'http://quizzes.fuzzstaging.com/quizzes/js1';
    var selector = req.query.selector || 'body';

    utility.getCode(url, function(htmlBody) {
        if (htmlBody) {
            // For dat jQuery-like API
            var $ = cheerio.load(htmlBody);

            // Just for cleaner HTML output, not functionally required
            $('br').each(function() {
                $(this).remove();
            });

            var goal = '';
            $('span[hidden]').each(function() {
                goal += $(this).text();
            });
            $(selector).prepend('<div>'+goal+'</div>'); // Extract the hidden message

            // Handle hiding unused elements
            $('span:not([hidden])').remove();
            $('script').each(function() {
                $(this).remove();
            });

            res.send($.html());
        } else {
            res.send('Unable to retrieve HTML body');
        }
    });
};

/**
 * Fuzzes up a message
 *
 * @param req
 * @param res
 */
exports.scramble = function(req, res) {
    var options = utility.setOptions(req.body);

    var html = '<html><' + options.selector + '>';
    html += '<head><style>body{font-family:monospace}</style></head>';

    var spacerCount = 0; // Position in scrambleThis string
    // Iterate over the string and insert a garbageString after each index
    while (spacerCount <= options.scrambleThis.length) {
        var secretLetter = '<span hidden class="secretChar">' + options.scrambleThis[spacerCount] + '</span>';
        spacerCount++;

        // Fill the garbage string
        var postString = utility.garbageString(
            options.superSecretChars,
            options.minSpacing,
            options.maxSpacing,
            options.width
        );

        html += secretLetter + postString;
    }
    // add end chunk of chars
    html += utility.garbageString(options.superSecretChars, options.minSpacing, options.maxSpacing, options.width);
    html += '</' + options.selector + '></html>';

    res.send(html);
};

/**
 * Determines the Fuzz (or a similar URL's) pattern
 *
 * @param req
 * @param res
 */
exports.getPattern = function(req, res) {
    var url = req.query.url || 'http://quizzes.fuzzstaging.com/quizzes/js1';
    utility.getCode(url, function(htmlBody) {
        if (htmlBody) {
            var $ = cheerio.load(htmlBody);

            var lastIndex = 0; // Placeholder for secret character index()
            var stats = utility.getStats('stats'); // Load previously acquired stats
            var minRangeSinceLast = stats.minRange || 99999;
            var maxRangeSinceLast = stats.maxRange || 0;
            var charsUsed = utility.getStats('characters') || {}; // Load character stats

            $('span').each(function() {
                // If character of secret message
                if (typeof $(this).attr('hidden') != 'undefined') {
                    // Lowest spacing b/w secret characters?
                    if ($(this).index() > 0 && minRangeSinceLast > ($(this).index() - lastIndex)) {
                        minRangeSinceLast = $(this).index() - lastIndex;
                    }

                    // Highest spacing between characters?
                    if (maxRangeSinceLast < ($(this).index() - lastIndex)) {
                        maxRangeSinceLast = $(this).index() - lastIndex;
                    }

                    lastIndex = $(this).index();
                } else if (!$(this).is('br')) {
                    // Create/update record of character frequency
                    charsUsed[$(this).text()] =
                        typeof charsUsed[$(this).text()] != 'undefined' ? // Character already set?
                        charsUsed[$(this).text()] + 1 : 1; // Add count else create a record
                }
            });

            var breakIndexes = [];
            $('br').each(function() {
                breakIndexes.push($(this).index());
            });

            var characters = [];
            for (var key in charsUsed) {
                if (charsUsed.hasOwnProperty(key)) characters.push(key); // Get just the chars
            }

            var blockWidth = stats.blockWidth || 0;
            for (var i = 1; i < breakIndexes.length; i++) {
                // Find this break width and average it with the ones already found for more accurate results
                blockWidth = (blockWidth + (breakIndexes[i] - breakIndexes[i-1]))/2;
            }

            var statistics = {
                minRange: minRangeSinceLast,
                maxRange: maxRangeSinceLast,
                blockWidth: blockWidth
            };
            utility.writeStats('stats', JSON.stringify(statistics, undefined, 2));
            utility.writeStats('characters', JSON.stringify(charsUsed, undefined, 2));

            // Format so we can just copy/paste a request to /scramble
            var response = {
                minSpacing: minRangeSinceLast,
                maxSpacing: maxRangeSinceLast,
                superSecretChars: characters,
                width: blockWidth
            };

            res.json(response);
        } else {
            res.send('Unable to retrieve HTML body');
        }
    })
};

/**
 * Calculate some simple statistics for the data gathered
 *
 * @param req
 * @param res
 */
exports.data = function(req, res) {
    var stats = utility.getStats('stats');
    var characterFrequency = utility.getStats('characters');

    // Calculate total occurrences first
    var total = 0;
    for (var key in characterFrequency) {
        if (characterFrequency.hasOwnProperty(key)) {
            total += parseInt(characterFrequency[key]);
        }
    }

    // Then calculate percentages for each character
    var characterStats = {};
    for (var key in characterFrequency) {
        if (characterFrequency.hasOwnProperty(key)) {
            characterStats[key] = {
                frequency: characterFrequency[key],
                chanceOfOccurrence: (characterFrequency[key] / total) * 100
            }
        }
    }

    var response = {
        howMuchFunThisWas: '10/10',
        stats: stats,
        characterStats: characterStats
    };

    res.json(response)
};