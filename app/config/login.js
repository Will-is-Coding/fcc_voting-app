'use strict';

var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/users');
var bCrypt = require('bcrypt-nodejs');

module.exports = function(passport) {
    passport.serializeUser( function(user, done) {
        done(null, user._id);
    });
    
    passport.deserializeUser( function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
    
    var isValidPassword = function(user, password) {
        return bCrypt.compareSync(password, user.password);
    };
    
    passport.use('login', new LocalStrategy( {
            passReqToCallBack : true
        },
        function(req, username, password, done) {
            User.findOne({ 'username' : username },
                function(err, user) {
                    if (err)
                        return done(err);
                    if (!user) {
                        console.log('User not found with username: ' + username);
                        return done(null, false,
                            req.flash('message', 'User Not Found'));
                    }
                    
                    if (!isValidPassword(user, password)) {
                        console.log('Invalid Password');
                        return done(null, false,
                            req.flash('message', 'Invalid Password'));
                    }
                    
                    return done(null, user);
                });
        }
    ));
};