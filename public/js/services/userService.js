'use strict';

(function() {
    angular.module("VotingApp").service('userService', ['$http', '$rootScope', function($http, $rootScope) {
        var user = { username: '', ipaddress: '', admin: false  };
        var that = this;
        
        this.requestUsername = function( passUsername ) {
            $http({method: 'GET', url: '/api/user/verify'})
                .then( function successCB(response) {
                    console.log(response);
                    if ( response.data.username !== undefined ) {
                        $rootScope.username = response.data.username;
                        
                        that.setUser(response.data.username, response.data.ipaddress, response.data.admin);
                        passUsername( null, response.data.username, response.data.ipaddress, response.data.admin );
                    }
                }, function errorCB(error) {
                    if (error) {
                        console.log(error);
                        passUsername(error, null, null);
                        throw error;
                    }
                });
        };
        
        this.setUser = function(username, ip, admin) {
            user.username   = username;
            user.ipaddress  = ip;
            user.admin      = admin;
            $rootScope.username = username;
        };
        
        this.getUsername = function(passUsername) {
            if( user.username === '' || user.ipaddress === '' || user.username === undefined || user.ipaddress === undefined )
                return this.requestUsername( passUsername );
                
            return passUsername( null, user.username, user.ipaddress, user.admin );
        };
        
        
        
    }]);
})();