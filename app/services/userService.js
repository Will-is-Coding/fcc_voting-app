'use strict';
(function() {
    angular.module("VotingApp").factory('userService', ['$http', function($http, menuService) {
        var user = {};
        var _username = '';
        
        user.requestName = function(callback) {
            $http({method: 'GET', url: '/api/authenticate'})
                .then( function successCB(response) {
                    if ( response.data.username !== undefined ) {
                        user.setName(response.data.username);
                        callback();
                    }
                }, function errorCB(error) {
                    if (error)
                        throw error;
                });
        };
        
        user.setName = function(username) {
            _username = username;
        };
        
        user.getName = function() {
            return _username;
        };
        
        user.getMyPolls = function(callback) {
            $http({ method: 'GET', url: '/api/user/polls'})
                .then( function successCB(response) {
                    console.log(response);
                    callback(response.data);
                    
                }, function errorCB(error) {
                    if (error)
                        throw error;
                });
        };
        
        
        return user;
    }]);
})();