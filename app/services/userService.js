'use strict';
/** Make A Provider? **/
(function() {
    angular.module("VotingApp").service('userService', ['$http', function($http, menuService) {
        var user = { username: '', admin: false, polls: [] };
        var that = this;
        this.requestUsername = function( passUsername ) {
            $http({method: 'GET', url: '/api/authenticate'})
                .then( function successCB(response) {
                    if ( response.data.username !== undefined ) {
                        that.setUsername(response.data.username);
                        console.log(response.data.username);
                        passUsername( null, response.data.username );
                    }
                }, function errorCB(error) {
                    if (error) {
                        passUsername(error, null);
                        throw error;
                    }
                });
        };
        
        this.setUsername = function(username) {
            user.username = username;
        };
        
        this.getUsername = function(passUsername) {
            if( user.username === '' )
                return this.requestUsername( passUsername );
                
            return passUsername( null, user.username );
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