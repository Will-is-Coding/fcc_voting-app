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
 
 router.post('/signin', userHandler.signIn);
 
 router.get('/verify', auth.verifyToken, userHandler.verify);
 
 module.exports = router;