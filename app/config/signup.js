'use strict';

var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/users');
var bCrypt = require('bcrypt-nodejs');

module.exports = function(passport) {
    passport.use('signup', new LocalStrategy({
        passReqToCallback : true
    },
    function (req, username, password, done) {
        
        var findOrCreateUser = function() {
            User.findOne({ 'username' : username },
                function (err, user) {
                    if (err) {
                        console.log('Error in SignUp ' + err );
                        return done(err);
                    }
                    
                    if (user) {
                        console.log('User already exists');
                        return done(null, false,
                            req.flash('message', 'User Already Exists'));
                    }
                    else {
                        var newUser = new User();
                        
                        newUser.username = username;
                        newUser.password = createHash(password);
                        newUser.email = req.param('email');
                        
                        newUser.save(function(err) {
                            if (err) {
                                console.log('Error in Saving User: ' + err);
                                throw err;
                            }
                            
                            console.log('User registration successfull!');
                            return done(null, newUser);
                        });
                    }
                });
        };
        
        process.nextTick(findOrCreateUser);
    }));
    
    var createHash = function(password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    };
};