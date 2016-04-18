'use strict';
(function() {
    angular.module("VotingApp", ['ngRoute', 'ngCookies'])
            .config(['$httpProvider', function($httpProvider) {
                $httpProvider.defaults.withCredentials = true;
            }]);
})();