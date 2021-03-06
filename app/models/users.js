'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;


var User = new Schema({
    username: String,
    username_lower: String,
    password: String,
    email: String,
    ipaddress: String,

    token: String,
    active: Boolean,
    admin: Boolean
}, {
    toObject: {
        virtuals: true
    }, toJSON: {
        virtuals: true
    }
});

User.pre('save', function(next) {
    var user = this;
    user.active = true;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function(err, salt) {
            if (err) return next(err);
            
            bcrypt.hash(user.password, salt, function(err, hash) {
                if(err) return next(err);
                
                //user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

User.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (err) return cb(err);
        
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', User);
