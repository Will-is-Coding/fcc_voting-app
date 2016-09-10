'use strict';
(function() {
    var express = require('express');
    var router  = express.Router();
    
    var bodyparser      = require('body-parser');
    var cookieParser    = require('cookie-parser');

    var auth = require('../middleware/auth.js');
    var path = process.cwd();
    
    module.exports = function(app){
        app.use( bodyparser.json() );
    	app.use( bodyparser.urlencoded({extended: false}) );
    	app.use( cookieParser() );
    	
    	app.route('/')
		.get( function (req, res) {
			res.status(200).sendFile(path + '/public/index.html');
		});
        
        app.use(auth.verifyToken);
        app.use('/api/poll', require('./polls.js'));
        app.use('/api/user', require('./users.js'));

    };
    
})();