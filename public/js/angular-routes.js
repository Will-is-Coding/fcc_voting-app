'use strict';
(function() {
    angular.module('VotingApp').config(function($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'public/templates/pages/home/index.html',
            controller: 'TruePollController',
        })
        
        .when('/poll/:id', {
            templateUrl: 'public/templates/pages/poll/single.html',
            controller: 'TruePollController',
        })
        
        .when('/new/poll', {
            templateUrl: 'public/templates/pages/poll/new.html',
            controller: 'PollCreationController',
            authorize: true
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
            controller: 'UserPollsController',
            authorize: true
        })
        
        .when('/about', {
            templateUrl: 'public/templates/pages/about/index.html'
        }) 
        
        .otherwise({ redirectTo: '/' });
    })
    
    .run(['$rootScope', '$location', function($rootScope, $location) {
        $rootScope.$on("$routeChangeStart", function(evt, to, from) {
            if( to.authorize ) {
                to.resolve = to.resolve || {};
                if( !to.resolve.authorizationResolver ) {
                    to.resolve.authorizationResolver = function(authService) {
                        return authService.authorize();
                    };
                }
            }
        });
        
        $rootScope.$on("$routeChangeError", function(evt, to, from, error) {
            if( error instanceof AuthorizationError) {
                $location.path('/');
            }
        });
    }]);
    
    function AuthorizationError() {};
    AuthorizationError.prototype = Error.prototype;
    
})();