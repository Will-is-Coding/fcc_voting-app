'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var voteSchema = new Schema( {
   vote: String,
   count: Number
});

var pollSchema = new Schema( {
    question: String,
    options: [voteSchema],
    voters: Array,
    creator: String,
    creationDate: Number
});

// pollSchema.methods.userValidation = function() {} ?

var Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;