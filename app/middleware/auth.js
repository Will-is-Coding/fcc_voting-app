'use strict';
( function() {
    var jwt     = require('jsonwebtoken');
    var config = require('../../config.js');
    
    
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
    			jwt.verify(token, config.secret, function(err, decoded) {
    				if (err) {
                        console.log(err) ;
    					
    					req.username = undefined;
    					req.token	 = undefined;
    					next();
    				}
    				console.log('Has a verified cookie!!');
    				req.token       = decoded;
    				req.username    = decoded.username;
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
        
        
    };
})();