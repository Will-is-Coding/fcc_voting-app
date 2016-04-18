'use strict';

var express = require('express');
var routes = require('./app/routes/index.js');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var morgan = require('morgan');
var helmet = require('helmet');
var bodyParser = require('body-parser');
var jwt = require('express-jwt');
var unless = require('express-unless');
var NotFoundError = require(path.join(__dirname, "errors", "NotFoundError.js"));

var config = require('./config.js');


var app = express();
require('dotenv').load();

mongoose.connect(process.env.MONGO_URI);
app.set('superSecret', config.secret);

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(helmet());
app.use( function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'username');
    next();
});


app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/common', express.static(process.cwd() + '/app/common'));
app.use('/services', express.static(process.cwd() + '/app/services'));

/*app.all("*", function(req, res, next) {
    next(new NotFoundError('404'));
});*/

/*app.use(function (err, req, res, next) {
    var errorType = typeof err,
        code = 500,
        msg = { message: "Internal Server Error" };
        
    switch (err.name) {
        case "UnauthorizedError":
            code = err.status;
            msg = undefined;
            break;
        case "BadRequestError":
        case "UnauthorizedAccessError":
        case "NotFoundError":
            code = err.status;
            msg = err.inner;
            break;
        default:
            break;
    }
    
    return res.status(code).json(msg);
});*/

routes(app, passport);

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});