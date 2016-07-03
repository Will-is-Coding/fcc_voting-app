'use strict';
//TODO: ADD VERIFCATION OF SAVING, UPDATING, AND REMOVING; ONLY ONE OPTION TO ADD PER USER?
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var voteSchema = new Schema( {
   vote: String,
   count: Number
});

var voterSchema = new Schema( {
    username: String
});

var pollSchema = new Schema( {
    question: String,
    options: [voteSchema],
    voters: [voterSchema],
    creator: {
        name: String,
        ipaddress: String
    },
    creationDate: {
        unix: String,
        human: String
    },
    live: Boolean,
    secret: Boolean
});

// pollSchema.methods.userValidation = function() {} ?


var Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;