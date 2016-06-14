'use strict';
(function() {
    angular.module("VotingApp", ['ngRoute', 'ngCookies', 'ui.bootstrap'])
            .config(['$httpProvider', function($httpProvider) {
                $httpProvider.defaults.withCredentials = true;
            }]);
})();