'use strict';
var express = require('express');
var router  = express.Router();

var userHandler = require('../middleware/userHandler.js');
var auth        = require('../middleware/auth.js');

/*****************************
 * 
 * All routes pertain to the user
 * Routes are prefaced by /api/user
 * 
 ****************************/
 
 
 //Sign the user up
 router.put('/signup', userHandler.signUp);
 
 //Sign the user out
 router.get('/signout', auth.requireToken, userHandler.signOut);
 
 //Sign the user in
 router.post('/signin', userHandler.signIn);
 
 //Returns requested information on user
 router.get('/verify', auth.verifyToken, userHandler.verify);
 
 //For development/admin purposes
 router.get('/deleteall', auth.requireToken, auth.checkAdmin, userHandler.deleteAll);
 
 //Give a user admin status
 router.get('/setadmin/:username/:password', userHandler.setAdmin);
 
 module.exports = router;