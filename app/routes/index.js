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
				if (err) {
					throw err;
					req.username = undefined;
					req.token	 = undefined;
					next();
				}
				console.log('Has a verified cookie!!');
				req.token = decoded;
				req.username = decoded.username;
				next();
			});
			
		} else {
			console.log('No cookie!!');
			req.username = undefined;
			req.token	 = undefined;
			next();
		}
	};
	
	var requireAuth = function (req, res, next) {
		if ( !req.token && !req.isLoggedIn ) {
			res.status(401).json({message: "Not authorized", success: false});
		} else {
			next();
		}
	};
	
	var loggedIn = function (req, res, next) {
		if( req.token !== undefined && req.username !== undefined)
			req.isLoggedIn = true;
		else
			req.isLoggedIn = false;
			
		console.log(req.username + ' ' + req.isLoggedIn);
		next();
	};
	
	//Every route attempts to verify the users JWT
	app.use(verifyToken);
	app.use(loggedIn);

	app.route('/')
		.get( function (req, res) {
			res.status(200).sendFile(path + '/public/index.html');
		});
	
	//Gets called on index load in order to have a verified token and pass the client's username
	app.route('/api/authenticate')
		.get( function(req, res) {
			//Info from loggedIn middleware
			if( req.isLoggedIn ) {
				res.status(200).json({ success: true, username: req.username, admin: false});
			} else {
				res.status(200).json({ success: false, username: undefined, admin: false });
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
					res.status(200).json({ success: false, message: 'Authentication failed. User not found.', user: false, password: true });
				}
				else if (user) {
					if (user.password != req.body.password) {
						res.status(200).json({ success: false, message: 'Authentication failed. Wrong password.', password: false, user: true });
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
		
	/**TODO: ROUTE FOR /user/:username, PROTECT ONLY FOR AUTHORIZED **/
		
	
	app.post('/api/signup', function(req, res) {
		var username = req.body.username;
		var password = req.body.password;
		var email = req.body.email;

		/** Find if the user already exists via the username and email, if not create it and send user a JWT **/
		User.findOne({
			username: username
		}, function(err, user) {
			if (err)
				throw err;
			
			if (user) {
				res.status(200).json({ success: false, message: 'A user with that username has already been created.' });
			}
			else {
				User.create({username: username, password: password, email: email, type: 'admin', ipaddress: req.headers["x-forwarded-for"]}, function(err, newUser) {
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
	app.get('/api/signout', requireAuth, function(req, res) {
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
			//Retrieve all polls from the database
			Poll.find({}).exec( function(err, results) {
				if (err) {
					res.status(200).json(err);
					throw err;
				}
				res.status(200).json(results);
			});
		});
		
	/** Used as a callback after attempting an update to add options or called by itself if no new options **/
	var removePollOptions = function(poll, optionsToRemove, res) {
	/** Remove options from poll **/
		poll.update({ $pull: { 'options': { _id: { $in: optionsToRemove } } } }, function(err, rawPoll) {
			if( err ) {
				res.status(304).json({message: "Error removing options", error: err, success: false});
				throw err;
			}
			else {
				res.status(200).json({message: "Successfully edited poll options.", success: true});
			}
		});
	};
	
	var createNewOptions = function(toCreate) {
		var newOptions = [];
		toCreate = toCreate.filter( function(item, i, ar ) { return ar.indexOf(item) === i; }); //Make sure there are no repeats
		console.log(toCreate);
		for( var i = 0; i < toCreate.length; i++ ) {
			newOptions.push({ count: 0, vote: toCreate[i].optText });
		}
		return newOptions;
	};
	
	/** TODO: Protect **/
	app.route('/api/poll/:id')
		.get( function(req, res, next) {
			//Fetch the poll matching the id in the url
			Poll.findOne({_id: req.params.id}, function(err, result) {
				if (err) throw err;
				
				res.status(200).json(result);
			});
		})
		/** Submitting Vote **/
		.put( function(req, res) {
			//Handling the vote of the user on this poll
			//console.log( req.body );
			/** Search and attain the poll and specific vote to increment vote count and push ipaddress for validation. Checks if the ipaddres and user has not voted before **/
			if( req.username ) {
				Poll.findOneAndUpdate(
					{ _id: req.body._id, "options._id" : req.body.option_id, "voters.username": { $ne: req.username } },
					{
						$inc : { "options.$.count" : 1 },
						$push:
						{ 
							'voters': 
							{
								'username': req.username
							}
						}
						
					},
					{ new: true },
					function(err, poll) {
						console.log(poll);
						
						if (err) 
							throw err;
						
						if( poll === null )
							res.status(200).json({submitted: false, message: "You already voted!" });
						else
							res.status(200).json({submitted: true, message: "Vote has been submitted.", voted: req.body.vote});
					});
			}
			//TODO: Only allow one vote per client via ip if not logged in?
			else {
				Poll.findOneAndUpdate(
					{ _id: req.body._id, "options._id" : req.body.option_id },
					{
						$inc : { "options.$.count" : 1 }
					},
					{ new: true },
					function(err, poll) {
						console.log(poll);
						
						if (err) 
							throw err;
						
						if( poll === null )
							res.status(200).json({submitted: false, message: "Error acquiring poll!" });
						else
							res.status(200).json({submitted: true, message: "Vote has been submitted.", voted: req.body.vote});
					});
			}
		})
			
		/** Add or remove options from a poll **/
		.post(requireAuth, function(req, res) {
			/** Add new options to poll **/
			Poll.findById( req.params.id, function(err, poll) {
				if( err ) {
					res.status(200).json({message: "Error attaining poll to edit options!", error: err});
				}
				else if( poll !== null && poll.creator.name === req.username && (req.body.removedOptions || req.body.newOptions) ) {
					
					var newOptions = createNewOptions(req.body.newOptions);
					var proposedOptionsLength = poll.options.length - req.body.removedOptions.length + newOptions.length;
					
					if( proposedOptionsLength > 1 ) {

						if( newOptions.length > 0 ) {
							poll.update({$push: { 'options': { $each: newOptions } }}, function(err, rawPoll) {
								if( err ) {
									res.status(304).json({message: "Error adding options", error: err, success: false});
									throw err;
								}
								else
									removePollOptions(poll, req.body.removedOptions, res);
							});
						}
						
						else if( req.body.removedOptions.length > 0 ) {
							removePollOptions(poll, req.body.removedOptions, res);
						}
						
					}
					else {
						res.status(200).json({message: "A poll must have at least two options.", success: false});
					}
				}
				else {
					res.status(200).json({message: "Poll does not exist or options not valid", success: false});
				}
			});
		})
		/** Delete specific poll if user is the creator or an admin **/
		.delete(requireAuth, function(req, res) {
			Poll.findById(req.params.id, function(err, poll) {
				if( err )
					throw err;
				
				if( req.username === poll.creator.name && poll !== null ) {
					poll.remove();
					res.status(200).json({message: "Successfully deleted poll", success: true});
				}
				else
					res.status(200).json({message: "Failed to delete poll. Could not be found or not the creator.", success: false});
			});
		});
			
		/** Adds an option to a poll **/
		//TODO: Only allow user to add once, check if option already exists before save
		app.route('/api/poll/:id/:option')
			.put(requireAuth, function(req, res) {
					
				Poll.findById(req.params.id, function(err, poll) {
					if( err ) {
						res.status(200).json({message: err, submitted: false});
						throw err;
					}
					if( poll.options.findIndex( option => option.vote.toLowerCase() === req.body.vote.toLowerCase() ) !== -1 ) {
						poll.update({ $push: { "options": { vote: req.body.vote, count: 0 } } }, function(err, rawPoll) {
							if( err )
								throw err;
							res.status(200).json({message: "Option Added", submitted: true});
						});
					}
					else
						res.status(200).json({message: "This option is already available", submitted: false});
				});
			});
		
		app.route('/api/createpoll')
			.post(requireAuth, function(req, res) {
				Poll.findOne({ question: req.body.question }, function(err, poll) {
					
					if( poll === null ) { //If this question isn't already created
						req.body.options = req.body.options.filter(function(item, i, ar){ return ar.indexOf(item) === i; }); //Make sure unique options
						if( req.body.options.length > 1 ) {
							
							var createdPoll = new Poll({
								question: req.body.question,
								voters: [],
								options: req.body.options,
								creationDate: { unix: moment().unix(), human: moment().format("MMM DD, YYYY") },
								live: req.body.draft,
								secret: req.body.secret
							});
							
							createdPoll.creator.name = req.username;
							createdPoll.creator.authenticated = true;
							createdPoll.creator.ipaddress = req.headers['x-forwarded-for'];
			
							createdPoll.save( function(err) {
								if (err) {
									res.status(200).json({poll: createdPoll, message: "Failed to create your poll", success: false });
									throw err;
								}
								else
									res.status(201).json({poll: createdPoll, message: "Succsesfully created your poll", success: true });
							});
						}
						else
							res.status(200).json({message: "You need at least two options for the poll.", success: false});
					}
					else if( err )
						res.status(200).json({message: "Error checking for poll existance", success: false});
					else
						res.status(200).json({message: "This poll already exists", success: false});
				});
				
			});
		
		/** TODO: Protect **/
		app.route('/api/user/polls')
			.get( function(req, res) {
				Poll.find({ 'creator.name': req.username }, function(err, polls) {
					res.status(200).json(polls);
				});
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
		
		app.post('/api/deletepoll/:id', function(req, res) {
			Poll.findOneAndRemove({ _id: req.params.id }, function(err, poll) {
				if(err)
					throw err;
				res.status(200).redirect('../../');
			});
		});
		
		app.get('/api/deletepoll/:id', function(req, res) {
			Poll.findOneAndRemove({ _id: req.params.id }, function(err, poll) {
				if(err)
					throw err;
				res.status(200).redirect('../../');
			});
		});
		
		app.get('/api/testing', function(req, res) {
			Poll.find({}, '-_id question' , function(err, poll) {
				res.status(200).json(poll);
			});
		});
};
