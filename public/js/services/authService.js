'use strict';
(function() {
    angular.module('VotingApp').service('authService', [ '$http', '$location', function($http, $location) {
        
        var that = this;
        
        this.requestAuth = function() {
            return $http({method: 'GET', url: '/api/user/verify'})
                .then( function successCB(response) {
                    return {success: response.data.success, username: response.data.username};
                }, function errorCB(error) {
                    return {success: false};
                });
        };
        
        this.authenticated = false;
        this.authorize = function() {
            return this.requestAuth()
            .then(function(response) {
                console.log(response);
                if( response.success )
                    return true;
                
                throw new AuthorizationError();
            });
        };
    }]);
    
    function AuthorizationError(descrip) {
        this.name = "Forbidden";
        this.message = descrip || "User authentication required.";
    }

        AuthorizationError.prototype = Error.prototype;
})();