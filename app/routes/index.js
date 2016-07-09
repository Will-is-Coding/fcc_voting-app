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
			res.status(401).json({message: "Not authorized", success: false, submitted: false});
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
	
	
	var validOption = function(option) {
		var validStringRegEx = /([A-Za-z0-9])+/;
		if( option && validStringRegEx.exec(option) !== null && option.length <= 50)
			return true;
		else
			return false;
	};
	
	var validateQuestionAndOptions = function(question, options) {
		var validStringRegEx = /([A-Za-z0-9])+/;
		var validPoll = false;
		var validOptions = false;
		
		if( options.length === 1 )
			return { options: validOption(options[0]) };
			
		else if( question && validStringRegEx.exec(question) !== null && question.length > 1 ) {
			validPoll = true;
			options = options.filter(function(item, i, ar){ return ar.indexOf(item) === i; }); //Make sure unique options
			if( options.length > 1) {
				for( var i = 0; i < options.length; i++ ) {
					if( options[i] && validStringRegEx.exec(options[i]) !== null && options[i].length <= 50 ) {
						validOptions = true;
					}
					else
						break;
				}
			}
		}
		console.log( validPoll + ' ' + validOptions );
		return { poll: validPoll, options: validOptions };
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
		
		var validUsernameRegEx = /(?=.{4,15}$)^[a-zA-Z\-\_]+$/;

		/** Find if the user already exists via the username and email, if not create it and send user a JWT **/
		if( username !== undefined && validUsernameRegEx.exec(username) !== null ) {
			User.findOne({
				username: username, username_lower: username.toLowerCase()
			}, function(err, user) {
				if (err)
					throw err;
				
				if (user) {
					res.status(200).json({ success: false, message: 'A user with that username has already been created.' });
				}
				else {
					User.create({username: username, username_lower: username.toLowerCase(), password: password, email: email, type: 'admin', ipaddress: req.headers["x-forwarded-for"]}, function(err, newUser) {
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
		}
		else
			res.status(200).json({message: "Username must have 4-15 characters, no digits. '_', '.', '-' are allowed.", success: false});
		
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
	
	/** Retrieve all polls from the database **/
	app.route('/api/fetchpolls')
		.get( function(req, res) {
			Poll.find({}).exec( function(err, results) {
				if (err) {
					res.status(200).json(err);
					throw err;
				}
				res.status(200).json(results);
			});
		});
		
	/** Used as a callback after attempting an update to add options or called by itself if no new options **/
	var removePollOptions = function(poll_id, optionsToRemove, res) {
		
		Poll.findByIdAndUpdate(poll_id, {
			$pull: {
				"options": {
					_id: {
						$in: optionsToRemove
					}
				}
			}
		}, { new: true },
		function(err, poll) {
			if( err ) {
				res.status(304).json({message: "Error removing options", error: err, success: false});
				throw err;
			}
			else {
				res.status(200).json({message: "Successfully edited poll options.", success: true, options: poll.options});
			}
		});
	};
	
	/** Create valid new options to push into the poll **/
	var createNewOptions = function(toCreate) {
		var newOptions = [];
		toCreate = toCreate.filter( function(item, i, ar ) { return ar.indexOf(item) === i; }); //Make sure there are no repeats
		console.log(toCreate);
		for( var i = 0; i < toCreate.length; i++ ) {
			if( toCreate[i] !== undefined && toCreate[i].length > 0)
				newOptions.push({ count: 0, vote: toCreate[i] });
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
			var ipaddress = req.headers['x-forwarded-for'];
			/** Search and attain the poll and specific vote to increment vote count and push ipaddress for validation. Checks if the ipaddres and user has not voted before **/
			if( req.username ) {
				Poll.findOneAndUpdate(
					{ _id: req.body._id, "options._id" : req.body.option_id, "options.vote": req.body.vote, "voters.username": { $ne: req.username } },
					{
						$inc : { "options.$.count" : 1 },
						$push:
						{ 
							'voters': 
							{
								'username': req.username,
								'votedFor_id': req.body.option_id
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
						else {
							res.status(200).json({submitted: true, message: "Vote has been submitted.", voted: req.body.vote, options: poll.options});
						}
					});
			}
			/** If client not logged in, check against ipaddress **/
			else {
				Poll.findOneAndUpdate(
					{ _id: req.body._id, "options._id" : req.body.option_id, "options.vote": req.body.vote, "voters.ipaddress": { $ne: ipaddress } },
					{
						$inc : { "options.$.count" : 1 },
						$push:
						{
							'voters':
							{
								'ipaddress': ipaddress,
								'votedFor_id': req.body.option_id
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
							res.status(200).json({submitted: true, message: "Vote has been submitted.", voted: req.body.vote, options: poll.options});
					});
			}
		})
			
		/** Add or/and remove options from a poll as the creator **/
		//TODO: Middleware: Check if user is creator of poll;  VALIDATE OPTIONS - CHECK IF THEY ARE IN POLL ALREADY
		.post(requireAuth, function(req, res) {
			
			if( req.body.removedOptions || req.body.newOptions ) {
				var totalOptionsLength = req.body.options.length + req.body.newOptions.length;
				if( totalOptionsLength > 1 ) {
					if( req.body.newOptions ) { 
						if( req.body.newOptions.length > 0 && validateQuestionAndOptions("options only", req.body.newOptions).options ) {
							var formattedOptions = createNewOptions(req.body.newOptions);
							
							/** Add new options to poll **/
							Poll.findByIdAndUpdate( req.params.id,{
								$push: {
									"options": {
										$each: formattedOptions
									}
								}
							}, { new: true },
							function(err, poll) {
								if( err ) {
									res.status(304).json({message: "Error adding options", error: err, success: false});
									throw err;
								}
								if( poll !== null ) {
									if( req.body.removedOptions && req.body.removedOptions.length > 0 )
										removePollOptions(poll._id, req.body.removedOptions, res);
									else
										res.status(200).json({message:"Successfully added options", success: true, options: poll.options});
								}
								else
									res.status(200).json({message:"Error finding or adding to poll", success: false});
							});
						}
						else 
							res.status(200).json({message: "Invalid new options", success: false});
					}
					else 
						removePollOptions( req.params.id, req.body.removedOptions, res );
				}
				else
					res.status(200).json({message: "A poll must have at least two options", success: false});
			}
			else
				res.status(200).json({message:"Must have options to add or remove", success: false});
		})
		/** Delete specific poll if user is the creator or an admin **/
		.delete(requireAuth, function(req, res) {
			Poll.findById(req.params.id, function(err, poll) {
				if( err ) {
					res.status(200).json({error: err, success: false});
					throw err;
				}
				
				if( req.username.toLowerCase() === poll.creator.name.toLowerCase() && poll !== null ) {
					poll.remove();
					res.status(200).json({message: "Successfully deleted poll", success: true});
				}
				else
					res.status(200).json({message: "Failed to delete poll. Could not be found or not the creator.", success: false});
			});
		});
		
	
			
	/**
	 * ROUTES:
	 *		PUT: Adds an option to a poll
	 *		DELETE: Delete users' vote from poll
	 *
	 */
	//TODO: Middleware check if option is not already in poll
	app.route('/api/poll/:id/:option')
		.put(requireAuth, function(req, res) {
			

			var optIndexIfUserAdded = req.body.options.findIndex( option => option.addedBy === req.username );
			var isUniqueOption = req.body.options.findIndex( option => option.vote.toLowerCase() === req.body.vote.toLowerCase() );
			
			if( validOption(req.body.vote) && isUniqueOption === -1 ) {
				if( optIndexIfUserAdded === -1 || req.body.creator.toLowerCase() === req.username.toLowerCase() ) {
					
					Poll.findByIdAndUpdate( req.params.id, {
						$push: {
							"options": {
								"vote": req.body.vote,
								"count": 0,
								"addedBy": req.username
							}
						}
					}, { new: true },
					function(err, poll) {
						if( err ) {
							res.status(200).json({message: err, submitted: false});
						}
						res.status(201).json({message: "Option Added", submitted: true, options: poll.options });
					});
					
				}
				else
					res.status(200).json({message: "You've already added an option", submitted: false});
			}
			else
				res.status(200).json({message: "Not a valid option", submitted: false});
		})
		.delete(requireAuth, function(req, res) {
			console.log(req.params.option);
			Poll.findOneAndUpdate({ _id: req.params.id, "options.addedBy": req.username, "options._id": req.params.option },
			{
				$pull: {
					options: {
						_id: req.params.option,
						addedBy: req.username
					},
					voters: {
						votedFor_id: req.params.option
					}
				}
			}, {new: true},
			function(err, poll) {
				if( err ) {
					res.status(200).json({error: err, submitted: false});
					throw err;
				}
				if( poll ) {
					console.log(poll.options);
					res.status(200).json({message: "Succesfully removed your option", submitted: true, options: poll.options, voters: poll.voters});
				}
				else
					res.status(200).json({message: "Option not found or not the creator", submitted: false});
			});
		});
	
	/**
	 * ROUTES:
	 *		DELETE: Delete users' vote from poll
	 *
	 */
	 //TODO: Make sure the 
	app.route('/api/poll/:id/remove_vote/:option')
		.delete(requireAuth, function(req, res) {
			
			Poll.findOneAndUpdate( {_id: req.params.id, "options._id" : req.params.option },
				{
					$inc: {
						"options.$.count": -1
					},
					$pull: {
						voters: { $in: [req.username] }
					}
				}, {new: true}, function(err, poll) {
					if( err ) {
						res.status(200).json({error: err, submitted: false});
						throw err;
					}
					if( poll ) {
						console.log(poll.voters);
						res.status(200).json({message: "Removed your vote", submitted: true, options: poll.options});
					}
					else
						res.status(200).json({message: "Error updating poll", submitted: false});
				});
		});
		

	app.route('/api/createpoll')
		.post(requireAuth, function(req, res) {
			Poll.findOne({ question: req.body.question, question_lower: req.body.question.toLowerCase() }, function(err, poll) {
				
				if(err)
					res.status(200).json({message: "Error checking for poll existance", success: false, pollSuccess: false, optionsSuccess: false});
				
				else if( poll === null ) {
					var validPoll = validateQuestionAndOptions(req.body.question, req.body.options);

					if( validPoll.poll && validPoll.options ) {
						var craftedOptions = createNewOptions(req.body.options);
						
						var createdPoll = new Poll({
							question: req.body.question,
							question_lower: req.body.question.toLowerCase(),
							voters: [],
							options: craftedOptions,
							creationDate: { unix: moment().unix(), human: moment().format("MMM DD, YYYY") },
							live: req.body.draft,
							secret: req.body.secret
						});
						
						createdPoll.creator.name = req.username;
						createdPoll.creator.authenticated = true;
						createdPoll.creator.ipaddress = req.headers['x-forwarded-for'];
						
						createdPoll.save( function(err) {
							if (err) {
								res.status(200).json({ err: err, message: "Failed to create your poll", success: false, pollSuccess: false, optionsSuccess: false });
								throw err;
							}
							else
								res.status(201).json({poll_id: createdPoll._id, message: "Successfully created your poll", success: true, pollSuccess: true, optionsSuccess: true });
						});
						
					}
					else if( validPoll.poll && !validPoll.questions ) {
						res.status(200).json({message: "You need at least two valid options for the poll", success: false, pollSuccess: true, optionsSuccess: false});
					}
					else if( !validPoll.poll && validPoll.questions ) {
						res.status(200).json({message: "You need a valid poll question, with at least 4 characters", success: false, pollSuccess: true, optionsSuccess: false});
					}
					else {
						res.status(200).json({message: "Both the options and poll question are invalid", success: false, pollSuccess: false, optionsSuccess: false});
					}
				}
				else
					res.status(200).json({message: "This poll already exists", success: false, pollSuccess: false, optionsSuccess: true});
			});
			
		});
		
	app.route('/api/user/polls')
		.get(requireAuth, function(req, res) {
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
	
	app.get('/api/deleteallusers', function(req, res) {
		User.remove({}, function(err, user) {
			res.status(200).json({message:"Deleted all users"});
		});
	});
	
	app.get('/api/allpolls', function(req, res) {
		Poll.find({}, function(err, poll) {
			res.json(poll);
		});
	});
	
	app.get('/api/deletevotes/:id', function(req, res) {
		
		Poll.findById(req.params.id, function(err, poll) {
			
			if( poll ) {
				var optionsToReturn = [ {vote: "A", count: 0}, {vote:"B", count: 0}];
				
				poll.update({}, { $set: { "options.$.count": 0 }}, function(err, raw) {
					res.status(200).json(poll);
				});
			}
			else
				res.status(200).json({message: "Nope"});
		});
	});
	
	app.get('/api/testing', function(req, res) {
		Poll.find({}, '-_id question' , function(err, poll) {
			res.status(200).json(poll);
		});
	});
};
