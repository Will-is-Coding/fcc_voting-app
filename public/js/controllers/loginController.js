'use strict';
//TODO: Form verification
(function() {
    angular.module('VotingApp').controller('LoginController', [ '$http', '$scope', '$location', 'userService', 'navService', function($http, $scope, $location, userService, navService) {
        $scope.message = "";
        $scope.userError = false;
        $scope.userErrorMessage = "";
        $scope.passwordError = false;
        
        
        $scope.passwordEmpty = function() {
            if( $scope.user.password === undefined && $scope.passwordError )
                $scope.passwordError = false;
        };
        
        $scope.validateUsername = function() {
            var validUsernameRegEx = /(?=.{4,15}$)^[a-zA-Z\-\_]+$/;

            if( $scope.user.username !== undefined ) {
                if( validUsernameRegEx.exec($scope.user.username) === null ) {
                    $scope.userError = true;
                    $scope.message = "Must be 4-15 characters. No digits. Underscores, periods, and dashes allowed";
                }
                else {
                    $scope.userError = false;
                }
            }
            else if( !$scope.user.username && $scope.userError === true ) {
                $scope.userError = false;
            }
        };
        
        //TODO: Move to userService?
        $scope.attemptLogin = function(user) {
            console.log(user);
            $http({ method: 'POST', url: '/api/user/signin', data: JSON.stringify(user) })
                .then( function successCB(response) {
                    console.log(response);
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