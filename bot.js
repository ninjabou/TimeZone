var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var spacetime = require('spacetime'); // Needed to avoid aneurism
var informal = require('spacetime-informal'); // Needed to avoid second aneurism

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

logger.info('TOKEN:' + auth.token)

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

// Displays in the console when the bot connects to Discord
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    bot.sendMessage({
        to: '137006237685383168', //my userID
        message: 'I\'ve started up! If this was unexpected, consider investigating, as this could indicate that I crashed!'
    });
    bot.setPresence( {
        game: { 
            type: 0, 
            name: 'on ' + Object.keys(bot.servers).length + ' servers (%t)'
        } 
    } );
});

bot.on('disconnect', function(erMsg, code) {
    logger.info('⚠  disconnected!\n   code: ' + code + '\n   reason: ' + erMsg + '\n   Attempting to reconnect...');
    bot.connect();
});

bot.on('message', function (user, userID, channelID, message, evt) {

    // Listens for messages that start with '%t '
    // and is followed by an argument keyword
    if (message.substring(0, 3).toLowerCase() == '%t ') {
        var args = message.substring(3).toLowerCase().split(' ');
        for(var arg of args){
            arg = arg.replace( /[\\_\\-]/g , ' ');
            logger.info(arg);
        }
        args = args.splice(0);

        switch(args[0]) {
            //case 'ping':
            //console.log("   ⮡ SENT IN CHANNEL " + channelID + ", FROM " + user + " (" + userID + ")");
            //bot.sendMessage({
            //to: channelID,
            //message: 'Pong!'
            //});
            //break;

	    //case 'sping':
            //    bot.sendMessage({
            //        to: channelID,
            //        message: 'Spong!'
            //    });
            //break;


            case 'now':
                if(args.length < 2){
                    bot.sendMessage({
                        to: channelID,
                        message: 'Too few arguments! Try `%t now EST`'
                    });
                    break;
                }
                // Checks if spacetime-informal recognizes the user's input
                if(informal.display(args[1]) != null){
                    if(args[1] != null && args[1] != ''){
                        var d = spacetime.now(informal.find(args[1]));
                        d = d.goto(informal.find(args[1]));
                        var day = d.dayName().charAt(0).toUpperCase() + d.dayName().slice(1)

                        // Changes message depending on the time of day
                        if(d.hour() <= 9){
                            bot.sendMessage({
                                to: channelID,
                                message: 'Good Morning! It\'s `' + day + '` in `' + (typeof(informal.display(d.timezone().name).standard) == 'undefined' ? d.timezone().name : informal.display(d.timezone().name).standard.abbrev) + '`, and the time is `' + d.time() + '`'
                            });
                        }
                        if(d.hour() <= 16 && d.hour() > 9){
                            bot.sendMessage({
                                to: channelID,
                                message: 'Today is `' + day + '` in `' + (typeof(informal.display(d.timezone().name).standard) == 'undefined' ? d.timezone().name : informal.display(d.timezone().name).standard.abbrev) + '`, and the time is `' + d.time() + '`'
                            });
                        }
                        if(d.hour() > 16){
                            bot.sendMessage({
                                to: channelID,
                                message: 'It\'s `' + day + '` night in `' + (typeof(informal.display(d.timezone().name).standard) == 'undefined' ? d.timezone().name : informal.display(d.timezone().name).standard.abbrev) + '`, and the time is `' + d.time() + '`'
                            });
                        }
                    }
                } else {
                    bot.sendMessage({
                        to: channelID,
                        message: 'Sorry, I couldn\'t find a timezone for `' + args[1] + '`. Try using an different name'
                    });
                }
            break;

            case 'convert':

                // If user uses three or more timezones,
                // TimeZone only uses the first two
                if(args.length >= 4){

                    // Another check for spacetime-informal, but for both timezones
                    if(informal.display(args[2]) != null && informal.display(args[3]) != null){
                        if(args[2] != null && args[2] != '' && args[1] != null && args[1] != ''){
                            if(args[3] != null && args[3] != ''){

                                var id = spacetime(informal.find(args[2]));
                                // Needed to fix a bug where the timezone would default to America/New_York
                                id = id.goto(informal.find(args[2]));
                                id = id.time(args[1]);
                                logger.info(id.timezone().name);

                                var d = spacetime(informal.find(args[2]));
                                d = d.goto(informal.find(args[2]));
                                d = d.time(args[1]);
                                d = d.goto(informal.find(args[3]));

                                bot.sendMessage({
                                    to: channelID,
                                    message: '`' + id.time() + '` in `' + (typeof(informal.display(id.timezone().name).standard) == 'undefined' ? id.timezone().name : informal.display(id.timezone().name).standard.abbrev) + '` is `' + d.time() + '` in `' + (typeof(informal.display(d.timezone().name).standard) == 'undefined' ? d.timezone().name : informal.display(d.timezone().name).standard.abbrev) + '`'
                                });
                            }
                        } else {
                            bot.sendMessage({
                                to: channelID,
                                message: 'Too few arguments!'
                            });
                        }
                    } else {
                        bot.sendMessage({
                            to: channelID,
                            message: 'Sorry, I couldn\'t find a timezone for one of `' + args[2] + '` and `' + args[3] + '`. Try using an different name'
                        });
                    }
                // If user only includes one timezone, TimeZone convert to common US timezones
                // I may add more if I can figure out how tables work
                } else {
                    if(args.length == 3){
                        if(informal.display(args[2]) != null){
                            if(args[2] != null && args[2] != '' && args[1] != null && args[1] != ''){
                                var messageStruct = '';

                                var d = spacetime(informal.find(args[2]));
                                d = d.goto(informal.find(args[2]));
                                d = d.time(args[1]);

                                messageStruct += '`' + d.time() + '` in `' + informal.display(d.timezone().name) + '` converted to common timezones:\n\n';
                                d = d.goto(informal.find('pst'));
                                messageStruct += '`' + d.time() + '` : `PST`\n';
                                d = d.goto(informal.find('est'));
                                messageStruct += '`' + d.time() + '` : `EST`\n';
                                d = d.goto(informal.find('mst'));
                                messageStruct += '`' + d.time() + '` : `MST`\n';
                                d = d.goto(informal.find('cst'));
                                messageStruct += '`' + d.time() + '` : `CST`\n';
                                d = d.goto(informal.find('anchorage')); // This one might be wrong, double check
                                messageStruct += '`' + d.time() + '` : `AKST`\n';

                                bot.sendMessage({
                                    to: channelID,
                                    message: '' + messageStruct
                                });
                            } else {
                                bot.sendMessage({
                                    to: channelID,
                                    message: 'Too few arguments!'
                                });
                            }
                        } else {
                            bot.sendMessage({
                                to: channelID,
                                message: 'Sorry, I couldn\'t find a timezone for `' + args[2] + '`. Try using an different name'
                            });
                        }
                    } else {
                        if(args.length > 4){
                            bot.sendMessage({
                                to: channelID,
                                message: 'Too many arguments! You can only convert using one or two timezones'
                            });
                        }
                        if(args.length < 3){
                            bot.sendMessage({
                                to: channelID,
                                message: 'Too few arguments! You can convert using one or two timezones'
                            });
                        }
                    }
                }
            break;

            case 'help':
                bot.sendMessage({
                    to: channelID,
                    message: 'The following commands are currently available to use:```\n\nping - does what you\'d expect\nnow [timezone]- displays the current time in the provided region\nconvert [time] [from timezone] [to timezone (optional)] - converts a given time between two timezones\nhelp - hey, you\'re here now!```'
                });
            break;

            // Sent if user sends a nonsense command following '%t '
            default:
                if(args[0].substring(args[0].length - 3, args[0].length) == "ing"){
                    var str = args[0].substring(0,1).toUpperCase + args[0].substring(1, args[0].length - 3) + "ong!";
                    bot.sendMessage({
                        to: channelID,
                        message: str
                    });
                } else {
                    bot.sendMessage({
                        to: channelID,
                        message: 'Apologies, but I did not fully understand your request. For a list of commands, type `%t help`'
                    });
                }
            break;
         }
    }

    // Listens for messages that start with '%t '
    // and are NOT followed by an argument keyword
    if (message.toLowerCase() == '%t') {
        bot.sendMessage({
            to: channelID,
            message: 'Hello, <@' + userID + '>. For a list of commands, type `%t help`'
        });
    }
});
