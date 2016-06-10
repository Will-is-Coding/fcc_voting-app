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
	
	//Every route attempts to verify the users JWT
	app.use(verifyToken);

	app.route('/')
		.get( function (req, res) {
			res.status(200).sendFile(path + '/public/index.html');
		});
	
	//Gets called on index load in order to have a verified token and pass the client's username
	app.route('/api/authenticate')
		.get( function(req, res) {
			console.log('un: ' + req.username);
			if( req.username ) {
				res.status(200).json({ success: true, username: req.username});
			} else {
				res.status(200).json({ success: false });
		}
		})
		//Attempts to authenticate the user who is signed in already or attempting to sign in
		.post( function(req, res) {
			User.findOne({
				username: req.body.username
			}, function(err, user) {
				if (err) throw err;
				
				/** TODO: Send back one JSON with error of bad username, bad email, or both **/
				if (!user) {
					res.status(200).json({ success: false, message: 'Authentication failed. User not found.' });
				}
				else if (user) {
					if (user.password != req.body.password) {
						res.status(200).json({ success: false, message: 'Authentication failed. Wrong password.' });
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
								success: true,
								token: token,
								expires: expires,
								username: user.username
							});
						}
						else {
							res.status(200).json({
								status: "You had a cookie already",
								success: false,
								token: cookie_token,
							});
						}
					}
				}
			});
		});
		
	
	app.post('/api/signup', function(req, res) {
		var username = req.body.username;
		var password = req.body.password;
		var password_confirm = req.body.password_confirm; //TODO: ADD FORM VERIFICATION
		var email = req.body.email;

		/** Find if the user already exists via the username and email, if not create it and send user a JWT **/
		User.findOne({
			username: username,
			email: email
		}, function(err, user) {
			if (err)
				throw err;
				
			if (user)
				res.status(200).json({ success: false, message: 'A user with that username or email has already been created.' });
			else {
				User.create({username: username, password: password, email: email, ipaddress: req.headers["x-forwarded-for"]}, function(err, newUser) {
					if (err)
						throw err;
					else {
						var cookie_token = req.cookies.token;
						if( cookie_token === undefined ) {
							var expires = moment().add(1, 'days').unix(); //Token expires in one day( in the form of seconds via unix timestamp )
							var token = jwt.sign({
								iss: "will_is_coding",
								exp: expires,
								sub: newUser._id,
								username: newUser.username
							}, app.get('superSecret'));
						
							var nowDate = new Date(moment().add(1, 'days')); // cookie module expires with date object via unix timestamp in milliseconds
							cookie_token = cookie.serialize('token', token, {secure: true, httpOnly: true, expires: nowDate});
		
							res.status(200).cookie(cookie_token).json({
								status: "New cookie for you",
								success: true,
								token: token,
								expires: expires,
								username: newUser.username
							});
						}
						else {
							res.status(200).json({
								status: "You had a cookie already, you need to sign out if you wish to sign into another account.",
								success: false,
								token: cookie_token
							});
						}
					}
					
				});
					
			}
		});
		
	});
	
	/** Deletes the user's JWT cookie **/
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
				//Put options as CSVs?
				if (err) throw err;
				res.status(200).json(result);
			});
		})
		.put( function(req, res) {
			//Handling the vote of the user on this poll
			var ipaddress = req.headers['x-forwarded-for'];
			
			/** Search and attain the poll and specific vote to increment vote count and push ipaddress for validation **/
			Poll.findOneAndUpdate(
				{ _id: req.body._id, "options._id" : req.body.vote._id, "voters": { "$ne": ipaddress } },
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
					
					if( poll === null )
						res.status(200).json({submitted: false, message: "You already voted!"});
					else
						res.status(200).json({submitted: true, message: "Vote has been submitted."});
				});
			});
		
		app.route('/api/newpoll')
			.post( function(req, res) {
				var createdPoll = new Poll({
					question: req.body.question,
					voters: [],
					options: req.body.options,
					creator: req.username,
					creationDate: moment().unix()
				});

				createdPoll.save( function(err) {
					if (err) 
						throw err;
				});
				res.status(200).json(createdPoll);
			});
		
		/** Developing Purposes **/
		app.get('/api/users', function(req, res) {
			User.find({}, function(err, user) {
				res.json(user);
			});
		});
		
		app.get('/api/deleteall', function(req, res) {
			User.remove({}, function(err, user) {
				res.status(200).json({message:"Deleted all users"});
			});
		});
		
		app.get('/api/allpolls', function(req, res) {
			Poll.find({}, function(err, poll) {
				res.json(poll);
			});
		});
		
		app.get('/api/deletevoters/:id', function(req, res) {
			Poll.findOneAndUpdate({ _id: req.params.id }, function(err, poll) {
				poll.voters = [];
				res.status(200).json(poll);
			});
		});
};
