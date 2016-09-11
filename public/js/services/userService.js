'use strict';
/** Make A Provider? **/
(function() {
    angular.module("VotingApp").service('userService', ['$http', '$rootScope', function($http, $rootScope, menuService) {
        var user = { username: '', ipaddress: '', admin: false, polls: [] };
        var that = this;
        this.requestUsername = function( passUsername ) {
            $http({method: 'GET', url: '/api/user/verify'})
                .then( function successCB(response) {
                    if ( response.data.username !== undefined ) {
                        $rootScope.username = response.data.username;
                        that.setUsername(response.data.username, response.data.ipaddress);
                        passUsername( null, response.data.username, response.data.ipaddress );
                    }
                }, function errorCB(error) {
                    if (error) {
                        passUsername(error, null, null);
                        throw error;
                    }
                });
        };
        
        this.setUsername = function(username, ip) {
            user.username = username;
            user.ipaddress = ip;
            $rootScope.username = username;
        };
        
        this.getUsername = function(passUsername) {
            if( user.username === '' || user.ipaddress === '')
                return this.requestUsername( passUsername );
                
            return passUsername( null, user.username, user.ipaddress );
        };
        
        
        
    }]);
})();