'use strict';
(function() {
    angular.module('VotingApp').config(function($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'public/templates/pages/home/index.html',
            controller: 'AllPollsController',
        })
        
        .when('/poll/:id', {
            templateUrl: 'public/templates/pages/poll/single.html',
            controller: 'PollController',
        })
        
        .when('/new/poll', {
            templateUrl: 'public/templates/pages/poll/new.html',
            controller: 'PollCreationController'
        })
        
        
        .when('/login', {
            templateUrl: 'public/templates/pages/login/index.html',
            controller: 'LoginController'
        })
        
        .when('/signup', {
            templateUrl: 'public/templates/pages/signup/index.html',
            controller: 'SignupController'
        })
        
        .when('/user/polls', {
            templateUrl: 'public/templates/pages/user/polls.html',
            controller: 'UserPollsController'
        })
        
        .otherwise({ redirectTo: '/' });
    });
})();