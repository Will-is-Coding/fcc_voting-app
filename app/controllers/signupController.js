'use strict';

(function() {
    angular.module('VotingApp').controller('SignupController', [ '$http', '$scope', '$location', 'userService', 'navService', function($http, $scope, $location, userService, navService) {
        $scope.newUser = { username: "", password: "", email: "" };
        
        
        $scope.passwordRepeat = "";
        $scope.passwordError = false;
        $scope.error = false;
        $scope.message = "";
        
        $scope.checkPasswords = function() {
            if( $scope.newUser.password !== $scope.passwordRepeat )
                $scope.passwordError = true;
            else
                $scope.passwordError = false;
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