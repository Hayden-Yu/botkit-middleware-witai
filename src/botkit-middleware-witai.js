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
        var match = (p, e) => {
            if(!e.value || !e.confidence) {
                return false;
            }
            if(e.confidence >= config.minimum_confidence) {
                if(p instanceof RegExp) {
                    return p.test(e.value);
                } else { //treat t as string since botkit controller.hears allows only regex and string
                    return p.toLowerCase() === e.value.toLowerCase();
                }
            }
            return false;
        };

        if(message.entities) {
            for(let i = 0; i < Object.keys(message.entities).length; i++) {
                for(let j = 0; j < message.entities[Object.keys(message.entities)[i]].length; j++) {
                    for(let k = 0; k < patterns.length; k++) {
                        if(match(patterns[k], message.entities[Object.keys(message.entities)[i]][j])) {
                            logger.debug('hears found match: ' + JSON.stringify(message.entities[Object.keys(message.entities)[i]][j]));
                            return true;
                        }
                    } //k patterns
                } //j arrays
            } //i entities
        }
        return false;
    }; //hears

    return middleware;
}, logLevel: {debug: Log.DEBUG, info: Log.INFO, warn: Log.WARN, error: Log.ERROR}};
