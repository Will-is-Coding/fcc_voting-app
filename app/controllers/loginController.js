'use strict';
//TODO: Form verification
(function() {
    angular.module('VotingApp').controller('LoginController', [ '$http', '$scope', '$location', 'userService', 'navService', function($http, $scope, $location, userService, navService) {
        $scope.message = "";
        $scope.userError = false;
        $scope.passwordError = false;
        
        $scope.usernameEmpty = function() {
            if( $scope.user.username === undefined && $scope.userError )
                $scope.userError = false;
        };
        
        $scope.passwordEmpty = function() {
            if( $scope.user.password === undefined && $scope.passwordError )
                $scope.passwordError = false;
        };
        
        //TODO: Move to userService?
        $scope.attemptLogin = function(user) {
            console.log(user);
            $http({ method: 'POST', url: '/api/authenticate', data: JSON.stringify(user) })
                .then( function successCB(response) {
                    if( response.status === 200 && response.data.success === true) {
                        userService.setUsername(response.data.username);
                        navService.notify();
                        $location.url('/');
                    }
                    else if ( response.data.success === false ) {
                        if( !response.data.user && response.data.password ) {
                            $scope.userError = true;
                        }
                        else if( !response.data.password && response.data.user )
                            $scope.passwordError = true;
                            
                        $scope.message = response.data.message;
                    }
                },
                function errorCB(error) {
                    throw error;
                });
        };
    }]);
})();