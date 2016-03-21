'use strict';

var path = process.cwd();
var bodyparser = require('body-parser');
var express = require('express');
var Poll = require('../models/poll.js');

var options = {
	A: 0,
	B: 0,
	C: 0
};

function getPollFromDatabase(possiblePoll, ip, createNew) {
	return Poll.find({ question: possiblePoll.question }, function(err, polls) {
		if( err )
			console.log("ERR: " + err);
			
		if( (!polls || polls.length <= 0) && createNew ) {
			//console.log(possiblePoll.options);
			console.log('poll created!');
			return createPoll(possiblePoll, ip);
		}
		else if(polls.length > 0 && createNew) {
			polls[0].options = possiblePoll.options;

			polls[0].save( function(err) {
				if (err) throw err;
				
				console.log('Updated!');
			});
			return polls[0];
		}
		else if( !createNew ) {
			//possiblePoll.options; //Get options via :tag? or id
			return polls[0];
		}
			
	}).limit(1);
}

function createPoll(poll_question, poll_options) {
	var newPoll = new Poll({
		question: poll_question,
		options: poll_options,
		voters: []
	});

	
	newPoll.save( function(err) {
		if (err) throw err;
		
		console.log('Added!');
	});
	
	return newPoll;
}

module.exports = function (app, passport) {
	app.use( bodyparser.json() );
	app.use( bodyparser.urlencoded({extended: false}) );
	/*function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			res.redirect('/login');
		}
	}*/
	app.route('/')
		.get( function (req, res) {
			res.status(200).sendFile(path + '/public/index.html');
		});
		
	app.route('/api/fetchpolls')
		.get( function(req, res) {
			//Retrieve all poll ids for the link and the question to display
			Poll.find({}).select('_id question').exec( function(err, results) {
				if (err) throw err;
				res.status(200).json(results);
			});
		});
		
	app.route('/api/poll/:id')
		.get( function(req, res, next) {
			//Fetch the poll matching the id in the url
			Poll.findOne({_id: req.params.id}, function(err, result) {
				if (err) throw err;
				res.status(200).json(result);
			});
		})
		.put( function(req, res) {
			//Handling the vote of the user on this poll
			var ipaddress = req.headers['x-forwarded-for'];
			console.log( req.body.vote );
			Poll.findOneAndUpdate(
				{ "_id": req.body._id, "options._id" : req.body.vote._id },
				{
					"$update": {
						"$inc" : { "options.$.count" : 1 }
					}
				},
				{ new: true },
				function(err, poll) {
					if (err) throw err;
					console.log('the poll now: ' + poll);
					res.status(200).end();
				});
		});
};
