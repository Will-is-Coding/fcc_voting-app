'use strict';
(function() {
    angular.module("VotingApp", ['ngRoute', 'ngCookies', 'ui.bootstrap', 'ngclipboard'])
            .config(['$httpProvider', function($httpProvider) {
                $httpProvider.defaults.withCredentials = true;
            }]);
})();