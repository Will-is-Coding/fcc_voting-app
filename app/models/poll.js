'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var voteSchema = new Schema( {
   vote: String,
   count: Number
});

var voterSchema = new Schema( {
    username: String,
    ipaddress: String
});

var pollSchema = new Schema( {
    question: String,
    options: [voteSchema],
    voters: [{
        ipaddress: String,
        username: String
    }],
    creator: {
        name: String,
        authenticated: Boolean,
        ipaddress: String
    },
    creationDate: {
        unix: String,
        human: String
    },
    live: Boolean
});

// pollSchema.methods.userValidation = function() {} ?


var Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;