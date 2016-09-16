'use strict';
(function() {
    var moment          = require('moment');
    var jwt             = require('jsonwebtoken');
    var cookie          = require('cookie');
    var bcrypt			= require('bcryptjs');
    var config          = require('../../config.js');
    var User            = require('../models/users.js');
    
    /******************
     *
     * Begin middleware for user API
     * 
     ******************/
    module.exports = {
        signUp: function(req, res) {
            var username = req.body.username;
    		var password = req.body.password;
    		var email = req.body.email;
    		var validUsernameRegEx = /(?=.{4,15}$)^[a-zA-Z\-\_]+$/;
    
    		/** Find if the user already exists via the username and email, if not create it and send user a JWT **/
    		if( username !== undefined && validUsernameRegEx.exec(username) !== null ) {
    			User.findOne({
    				username: username, username_lower: username.toLowerCase()
    			}, function(err, user) {
    				if ( err ) {
    					res.status(200).json({error: err, success: false});
    					throw err;
    				}
    				
    				if ( user ) {
    					res.status(200).json({ success: false, message: 'A user with that username has already been created.' });
    				}
    				else {
    					bcrypt.hash(password, 10, function(error, hash) {
    						if( err ) {
    							res.status(200).json({error: error, success: false});
    							throw err;
    						}
	    					User.create({username: username, username_lower: username.toLowerCase(), password: hash, email: email, admin: false, ipaddress: req.headers["x-forwarded-for"]}, function(err, newUser) {
	    						if (err) {
	    							res.status(200).json({error: err, success: false});
	    							throw err;
	    						}
	    						
    							var cookie_token = req.cookies.token;
    							if( cookie_token === undefined ) {
    								var expires = moment().add(1, 'days').unix(); //Token expires in one day( in the form of seconds via unix timestamp )
    								var token = jwt.sign({
    									iss: "will_is_coding",
    									exp: expires,
    									sub: newUser._id,
    									username: newUser.username
    								}, config.secret);
    							
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
	    					});
    					});
    				}
    			});
    		}
    		else
    			res.status(200).json({message: "Username must have 4-15 characters, no digits. '_', '.', '-' are allowed.", success: false});
    		
        },
        
        signOut: function(req, res) {
            var now = moment().unix(); //Set to expire now

    		var expToken = jwt.sign({
    							iss: "will_is_coding",
    							exp: now,
    							sub: req.token.sub,
    							username: req.username
    						}, config.secret);
    		
    		var nowDate = new Date(moment());
    		req.cookies.token = cookie.serialize('token', expToken, {secure: true, httpOnly: true, expires: nowDate } );
    		res.status(200).cookie(req.cookies.token).redirect('../../');
        },
        
        signIn: function(req, res, next) {
            User.findOne({
				username: req.body.username
			}, function(err, user) {
				if ( err ) {
					res.status(200).json({error: err, success: false});
					throw err;
				}
				
				if ( !user ) {
					res.status(200).json({ success: false, message: 'Authentication failed. User not found.', user: false, password: true });
				}
				else {
					
					bcrypt.compare(req.body.password, user.password, function(error, b_res) {
						if( error ) {
							res.status(200).json({error: error, success: false});
							throw error;
						}	
						
						if( b_res ) {
							var cookie_token = req.cookies.token;
							if( cookie_token === undefined ) {
								var expires = moment().add(1, 'days').unix(); //Token expires in one day( in the form of seconds via unix timestamp )
								var token = jwt.sign({
									iss: "will_is_coding",
									exp: expires,
									sub: user._id,
									username: user.username,
									admin: user.admin
								}, config.secret);
								
								var nowDate = new Date(moment().add(1, 'days')); // cookie module expires with date object via unix timestamp in milliseconds
								cookie_token = cookie.serialize('token', token, {secure: true, httpOnly: true, expires: nowDate});
		                        
								res.status(200).cookie(cookie_token).json({
									status: "New cookie for you",
									success: true,
									token: token,
									expires: expires,
									username: user.username,
									admin: user.admin,
									ipaddress: req.ipaddress
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
						else
							res.status(200).json({ success: false, message: 'Authentication failed. Wrong password.', password: false, user: true });
					});
					
				}
			});
        },
        
        verify: function(req, res) {
            if( req.loggedIn ) {
				res.status(200).json({ success: true, username: req.username, ipaddress: req.ipaddress, admin: req.admin});
			} else {
				res.status(200).json({ success: false, username: undefined, ipaddress: req.ipaddress, admin: false });
            }   
        },
        
        setAdmin: function(req, res) {
    		if( req.params.password === config.password ) {
    			User.findOne({username: req.params.username}, function(err, user) {
    				if( err ) {
    					res.status(200).json({error: err, success: false});
    					throw err;
    				}
    				
    				if(user) {
    					user.admin = true;
    					user.save();
    					res.status(200).json({message: "User successfully given admin privleges", success: true});
    				}
    				else
    					res.status(200).json({message: "Could not find user", success: false});
    			});
    		}
    		else
    			res.status(200).json({message: "Incorrect password", success: false});
        },
        
        deleteAll: function(req, res) {
        	if( req.admin ) {
        		User.remove({admin: false}, function(err, user) {
        			if( err ) {
        				res.status(200).json({error: err, success: false});
        				throw err;
        			}	
        			
        			res.status(200).json({message: "All users deleted", success: true});
        		});
        	}
        	else
        		res.status(200).json({message: "Must be an admin", success: false});
        }
        
    };
})();