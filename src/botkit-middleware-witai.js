const Wit = require('node-wit').Wit;
const Log = require('node-wit').log;

module.exports = {botkitMiddlewareWitai: function(config) {

    //set default vales, create node-wit
    if (!config || !config.token) {
        throw new Error('No wit.ai API token specified');
    }
    if (!config.minimum_confidence) {
        config.minimum_confidence = 0.5;
    }
    config.log_level = config.log_level || Log.INFO;

    var logger = new Log.Logger(config.log_level);
    var client = new Wit({
        accessToken: config.token,
        logger: logger,
    });
    var middleware = {};

    middleware.receive = function(bot, message, next) {
        if(!message.text || message.bot_id !== undefined) {
            next();
        }
        else {
            client.message(message.text, {})
            .then((response) => {
                message.entities = response.entities;
                next();
            })
            .catch(next);
        }
    }; //receive

    middleware.hears = function(patterns, message) {
        var match = (pattern, name) => {
            if(pattern instanceof RegExp) {
                return pattern.test(name);
            } else { //treat pattern as string since botkit controller.hears allows only regex and string
                return pattern.toLowerCase() === name.toLowerCase();
            }
        };

        if(message.entities) {
            var names = Object.keys(message.entities);
            for(let i = 0; i < names.length; i++) {
                for(let k = 0; k < patterns.length; k++) {
                    if(match(patterns[k], names[i])) {
                        for(let j = 0; j < message.entities[names[i]].length; j++) {
                            if(message.entities[names[i]][j].confidence > config.minimum_confidence) {
                                logger.debug('hears found match: ' + JSON.stringify(message.entities[names[i]][j]));
                                return true;
                            }
                        }//j entity values
                    }
                } //k patterns
            } //i entities
        }
        return false;
    }; //hears

    return middleware;
}, logLevel: {debug: Log.DEBUG, info: Log.INFO, warn: Log.WARN, error: Log.ERROR}};
