'use strict';

var path = process.cwd();
var bodyparser = require('body-parser');
var express = require('express');
var Poll = require('../models/poll.js');
var GitHubStrategy = require('passport-github').Strategy;

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

	var isAuthenticated = function (req, res, next) {
		if (req.isAuthenticated())
			return next();
		res.redirect('#/');
	};

	app.route('/')
		.get( function (req, res) {
			res.status(200).sendFile(path + '/public/index.html');
		});
		
	app.post('/api/login', passport.authenticate('login', {
		successRedirect: '#/',
		failureRedirect: '#/login',
		failureFlash: true
	}));
	
	app.post('/api/signup', passport.authenticate('signup', {
		sucessRedirect: '#/',
		failureRedirect: '#/signup',
		failureFlash: true
	}));
	
	app.get('/api/signout', function(req, res) {
		req.logout();
		res.redirect('#/');
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
			
			/** Search and attain the poll and specific vote to increment vote count and push ipaddress for validation **/
			Poll.findOneAndUpdate(
				{ _id: req.body._id, "options._id" : req.body.vote._id },
				{
					$inc : 
						{ "options.$.count" : 1 },
					$push :
						{ voters : ipaddress }
				},
				{ new: true },
				function(err, poll) {
					if (err) throw err;
					console.log('the poll now: ' + poll);
					res.status(200).end();
				});
		});
		
		app.route('/api/polls/:userid')
			.get( function(req, res) {
				
			});
		
		app.route('/api/new/poll/:id')
			.get( function(req, res) {
				
			});
};
