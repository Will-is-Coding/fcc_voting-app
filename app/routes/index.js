'use strict';

var path = process.cwd();
var bodyparser = require('body-parser');
var express = require('express');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var moment = require('moment');
var cookie = require('cookie');
var cookieParser = require('cookie-parser');

var Poll = require('../models/poll.js');
var User = require('../models/users.js');

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

//Use expressJWT instead of verifyToken?
module.exports = function (app, passport) {
	app.use( bodyparser.json() );
	app.use( bodyparser.urlencoded({extended: false}) );
	app.use( cookieParser() );

	
	var getUser = function (token) {
			
	};
	
	//Verify the client's token, attach the token to the request, then next middleware
	var verifyToken = function (req, res, next) {
		var token = req.cookies.token;
		if (token !== undefined) {
			jwt.verify(token, app.get('superSecret'), function(err, decoded) {
				if (err)
					throw err;
				console.log('Has a verified cookie!!');
				req.token = decoded;
				req.username = decoded.username;
				next();
			});
			
		} else {
			console.log('No cookie!!');
			next();
		}
	};
	
	var requireAuth = function (req, res, next) {
		if ( !req.token ) {
			res.end('Not authorized.', 401);
		} else {
			next();
		}
	};
	
	app.use(verifyToken);

	app.route('/')
		.get( function (req, res) {
		/*	if( req.username ) { 
				var options = { 
					headers: {
						'username': req.username
					}
				};
				res.stats(200).sendFile(path + '/public/index.html', options);
			}*/
			res.status(200).sendFile(path + '/public/index.html');
		});
	
	//Gets called on index load in order to have a verified token and pass the client's username
	app.get('/api/authenticate', function(req, res) {
		console.log('un: ' + req.username);
		if( req.username ) {
			res.status(200).json({ success: true, username: req.username});
		} else {
			res.status(200).json({ success: false });
		}
	});
	
	app.post('/api/authenticate', function(req, res) {
		User.findOne({
			username: req.body.username
		}, function(err, user) {
			if (err) throw err;
			
			if (!user) {
				res.json({ success: false, message: 'Authentication failed. User not found.' });
			}
			else if (user) {
				if (user.password != req.body.password) {
					res.json({ success: false, message: 'Authentication failed. Wrong password.' });
				}
				else {
					var cookie_token = req.cookies.token;
					if( cookie_token === undefined ) {
						var expires = moment().add(1, 'days').unix(); //Token expires in one day( in the form of seconds via unix timestamp )
						var token = jwt.sign({
							iss: "will_is_coding",
							exp: expires,
							sub: user._id,
							username: user.username
						}, app.get('superSecret'));
						
						var nowDate = new Date(moment().add(1, 'days')); // cookie module expires with date object via unix timestamp in milliseconds
						cookie_token = cookie.serialize('token', token, {secure: true, httpOnly: true, expires: nowDate});

						res.status(200).cookie(cookie_token).json({
							status: "New cookie for you",
							token: token,
							expires: expires,
							user: user.toJSON()
						});
					}
					else {
						res.status(200).json({
							status: "You had a cookie already",
							token: cookie_token,
							user: user.toJSON()
						});
					}
				}
			}
		});
	});
		
	app.post('/api/login', function(req, res) {
		res.send('Not yet');
	});
	
	app.post('/api/signup', function(req, res) {
		res.send('Not yet');
	});
	
	app.get('/api/signout', function(req, res) {
		var now = moment().unix(); //Set to expire now
		
		var expToken = jwt.sign({
							iss: "will_is_coding",
							exp: now,
							sub: req.token.sub,
							username: req.username
						}, app.get('superSecret'));
		
		console.log(expToken);
		var nowDate = new Date(moment());
		req.cookies.token = cookie.serialize('token', expToken, {secure: true, httpOnly: true, expires: nowDate } );
		res.status(200).cookie(req.cookies.token).redirect('../');
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
		
		app.route('/api/new/poll/:id')
			.get( function(req, res) {
				
			});
		
		app.get('/api/users', function(req, res) {
			User.find({}, function(err, user) {
				res.json(user);
			});
		});
};
