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
        
        .otherwise({ redirectTo: '/' });
    });
})();