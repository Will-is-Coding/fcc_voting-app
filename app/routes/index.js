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
			res.end('Not authorized.', 401);
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
	
	var createNewOptions = function(toCreate) {
		var newOptions = [];
		for( var i = 0; i < toCreate.length; i++ ) {
			newOptions.push({ count: 0, vote: toCreate[i].optText });
		}
		return newOptions;
	};
	
	var removePollOptions = function(pollID, toRemove, errorAdding, res) {
		/** Remove options from poll **/
		Poll.findByIdAndUpdate(pollID,
			{
				$pull: { 'options': { _id: { $in: toRemove } } }
			},
			{
				new: true
			},
			function(err, poll) {
				if( err ) {
					res.status(200).json({message: "Error removing options!", error: err});
					throw err;
				}
				if( poll !== null ) {
					res.status(200).json({message: "Success", errorAdding: errorAdding, errorRemoving: false, poll: poll});
				}
				else {
					res.status(200).json({message: "Error", errorAdding: errorAdding, errorRemoving: true});
				}
			});
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
		
	/**TODO: ROUTE FOR /user/:username, PROTECT ONLY FOR AUTHORIZED **/
		
	
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
	/** TODO: Check if user has cookie or signed in **/
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
	
		
	/** TODO: Protect **/
	app.route('/api/fetchpolls')
		.get( function(req, res) {
			//Retrieve all polls from the database
			Poll.find({}).exec( function(err, results) {
				if (err) throw err;
				res.status(200).json(results);
			});
		});
	
	/** TODO: Protect **/
	app.route('/api/poll/:id')
		.get( function(req, res, next) {
			//Fetch the poll matching the id in the url
			Poll.findOne({_id: req.params.id}, function(err, result) {
				//Put options as CSVs?
				if (err) throw err;
				res.status(200).json(result);
			});
		})
		/** Submitting Vote **/
		.put( function(req, res) {
			//Handling the vote of the user on this poll
			var ipaddress = req.headers['x-forwarded-for'];
			console.log( req.body );
			/** Search and attain the poll and specific vote to increment vote count and push ipaddress for validation. Checks if the ipaddres and user has not voted before **/
			Poll.findOneAndUpdate(
				{ _id: req.body._id, "options._id" : req.params.id, "voters.ipaddress": { $ne: ipaddress }, "voters.username": { $ne: req.body.username } },
				{
					$inc : { "options.$.count" : 1 },
					$push:
					{ 
						'voters': 
						{
							'ipaddress': ipaddress, 'username': req.username
						}
					}
					
				},
				{ new: true },
				function(err, poll) {
					console.log(poll);
					if (err) throw err;
					
					if( poll === null )
						res.status(200).json({submitted: false, message: "You already voted!"});
					else
						res.status(200).json({submitted: true, message: "Vote has been submitted."});
				});
			})
			/** Add or remove options from a poll **/
			
			//TODO: Verifiy that there are at least two options in the poll - Use .findById() and save in callback and .pre save verification in poll model
			.post( function(req, res) {
				if( req.isLoggedIn ) {
					
					/** Add new options to poll **/
					var newOptions = createNewOptions(req.body.newOptions);
					Poll.findByIdAndUpdate(req.params.id,
						{
							$push: { 'options': { $each: newOptions } }
						},
						{
							new: true
						},
						function(err, poll) {
							if( err ) {
								res.status(200).json({message: "Error adding options!", error: err});
								throw err;
							}
							if( poll !== null ) {
								removePollOptions(req.params.id, req.body.removedOptions, false, res);
							}
							else {
								removePollOptions(req.params.id, req.body.removedOptions, true, res);
							}
							
					});
				}
				else
					res.status(401).json({message: 'Not Permitted'});
			})
			/** Delete specific poll if user is the creator or an admin **/
			//TODO: Add further verification to poll removal
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
			.put( function(req, res) {
				if( req.isLoggedIn ) {
					Poll.findByIdAndUpdate(
						req.params.id, 
						{ $push: { "options": { vote: req.body.vote, count: 0 } } },
						{ new: true },
						function(err, poll) {
							console.log(poll);
							res.status(200).json({submitted: true, message: "Option Added!"})
						});
				}
				else {
					res.status(200).json({message: "Failed to add option. You must be logged in to add options."});
				}
			});
			
		
		app.route('/api/createpoll')
			.post( function(req, res) {
				//TODO: Do findOneAndUpdate on the chance a question is the same( to all lower ); Verify question and options
				var createdPoll = new Poll({
					question: req.body.question,
					voters: [],
					options: req.body.options,
					creationDate: { unix: moment().unix(), human: moment().format("MMM DD, YYYY") },
					live: req.body.draft,
					secret: req.body.secret
				});
				
				if ( req.username !== undefined ) {
					createdPoll.creator.name = req.username;
					createdPoll.creator.authenticated = true;
				}
				else {
					createdPoll.creator.name = 'Anonymous';
					createdPoll.creator.authenticated = false;
				}
				
				createdPoll.creator.ipaddress = req.headers['x-forwarded-for'];

				createdPoll.save( function(err) {
					if (err) 
						throw err;
				});
				
				
				res.status(200).json(createdPoll);
			});
		
		/** TODO: Protect **/
		app.route('/api/user/polls')
			.get( function(req, res) {
				Poll.find({ 'creator.name': req.username }, function(err, polls) {
					res.status(200).json(polls);
				});
			});
			
		app.get('/shared/:poll', function (req, res) {
			
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
