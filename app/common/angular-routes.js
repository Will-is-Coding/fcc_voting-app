'use strict';
(function() {
    angular.module('VotingApp').config(function($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'public/templates/pages/home/index.html',
            controller: 'IndexController',
            controllerAs: 'indexCtrl'
        })
        
        .when('/poll/:id', {
            templateUrl: 'public/templates/pages/poll/index.html',
            controller: 'PollController',
            controllerAs: 'pollCtrl'
        })
        
        .when('/login', {
            templateUrl: 'public/templates/pages/login/index.html',
            controller: 'LoginController'
        })
        
        .when('/signup', {
            templateUrl: 'public/templates/pages/signup/index.html',
            controller: 'SignupController'
        })
        
        .when('/user/:username', {
            templateUrl: 'public/templates/pages/user/index.html',
            controller: 'UserController'
        })
        
        .otherwise({ redirectTo: '/' });
    });
})();