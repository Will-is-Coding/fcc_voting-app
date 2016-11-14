'use strict';
( function() {
    var jwt     = require('jsonwebtoken');
    var User    = require('../models/users.js');
    var secret  = process.env.SECRET;
    
    /******************
     *
     * Begin middleware for authorizing
     * 
     ******************/
    module.exports = {
        verifyToken: function(req, res, next) {
            req.ipaddress = req.headers['x-forwarded-for'];
            var token = req.cookies.token;
    		if (token !== undefined) {
    			jwt.verify(token, secret, function(err, decoded) {
    				if (err) {
                        console.log(err) ;
    					
    					req.username = undefined;
    					req.token	 = undefined;
    					next();
    				}
    				console.log('Has a verified cookie!!');
    				req.token       = decoded;
    				req.username    = decoded.username;
    				req.admin       = decoded.admin;
    				req.loggedIn    = true;
    				next();
    			});
    			
    		} else {
    			console.log('No cookie!!');
    			req.username = undefined;
    			req.token	 = undefined;
    			next();
    		}
        },
        
        requireToken: function(req, res, next) {
        	if ( !req.token && !req.isLoggedIn ) {
    			res.status(401).json({message: "Must be logged in", success: false, submitted: false});
    		} else {
    			next();
    		}
        },
        
        checkAdmin: function(req, res, next) {
            if( req.username ) {
                if( !req.admin ) {
                    User.findOne({username: req.username, username_lower: req.username.toLowerCase()}, 
                        function(err, user) {
                            if( err ) {
                                res.status(200).json({error: err, success: false});
                                throw err;
                            }
                            
                            if( user ) {
                                req.admin = user.admin;
                            }
                            else {
                                req.admin = false;
                            }
                            
                            next();
                        });
                }
                else
                    next();
            }
            else {
                req.admin = false;
                next();
            }
        }
        
    };
})();