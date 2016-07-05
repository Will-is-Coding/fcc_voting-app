'use strict';

(function() {
    angular.module('VotingApp').controller('SignupController', [ '$http', '$scope', '$location', 'userService', 'navService', function($http, $scope, $location, userService, navService) {
        $scope.newUser = { username: "", password: "", email: "" };
        
        
        $scope.passwordRepeat = "";
        $scope.passwordError = false;
        $scope.userError = false;
        $scope.userErrorMessage = "";
        $scope.error = false;
        $scope.message = "";
        
        $scope.checkPasswords = function() {
            if( $scope.newUser.password !== $scope.passwordRepeat && $scope.newUser.password )
                $scope.passwordError = true;
            else
                $scope.passwordError = false;
        };
        
        $scope.validateUsername = function() {
            var validUsernameRegEx = /(?=.{4,15}$)^[a-zA-Z\-\_]+$/;

            if( $scope.newUser.username !== undefined ) {
                console.log(validUsernameRegEx.exec($scope.newUser.username));
                if( validUsernameRegEx.exec($scope.newUser.username) === null ) {
                    $scope.userError = true;
                    $scope.userErrorMessage = "Must be 4-15 characters. No digits. Underscores, periods, and dashes allowed";
                }
                else {
                    $scope.userError = false;
                }
            }
            else if( !$scope.newUser.username && ($scope.userError === true || $scope.error) ) {
                $scope.userError = false;
                $scope.error = false;
            }
        };
        
        $scope.attemptSignup = function(newUser) {
            console.log(newUser);
            $http({ method: 'POST', url: 'api/signup', data: JSON.stringify(newUser) })
                .then( function successCB(response) {
                    console.log(response);
                    if( response.data.success ) {
                        navService.notify();
                        $location.url('/');
                    }
                    else {
                        $scope.error = true;
                        $scope.message = response.data.message;
                    }
                },
                function errorCB(err, status) {
                    throw err;
                });
        };
        
    }]);
})();