'use strict';
/** Make A Provider? **/
(function() {
    angular.module("VotingApp").service('userService', ['$http', function($http, menuService) {
        var user = { username: '', admin: false, polls: [] };
        var that = this;
        this.requestUsername = function(callback) {
            $http({method: 'GET', url: '/api/authenticate'})
                .then( function successCB(response) {
                    if ( response.data.username !== undefined ) {
                        that.setUsername(response.data.username);
                        console.log(response.data.username);
                        callback( null, response.data.username );
                    }
                }, function errorCB(error) {
                    if (error) {
                        callback(error, null);
                        throw error;
                    }
                });
        };
        
        this.setUsername = function(username) {
            user.username = username;
        };
        
        this.getUsername = function(callback) {
            if( user.username === '' )
                return this.requestUsername( callback );
                
            return user.username;
        };
        
        this.getMyPolls = function(callback) {
            $http({ method: 'GET', url: '/api/user/polls'})
                .then( function successCB(response) {
                    console.log(response);
                    callback(response.data);
                    
                }, function errorCB(error) {
                    if (error)
                        throw error;
                });
        };
        
    }]);
})();