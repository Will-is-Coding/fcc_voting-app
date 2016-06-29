'use strict';

(function() {
    angular.module('VotingApp').controller('SignupController', [ '$http', '$scope', '$location', 'userService', 'navService', function($http, $scope, $location, userService, navService) {
        $scope.newUser = { username: "", password: "", email: "" };

        $scope.attemptSignup = function(newUser) {
            console.log(newUser);
            $http({ method: 'POST', url: 'api/signup', data: JSON.stringify(newUser) })
                .then( function successCB(data) {
                    console.log(data);
                    if(1 === 1) {
                        //userService.setName(data.data.username);
                        navService.notify();
                        $location.path('/');
                    }
                },
                function errorCB(err, status) {
                    throw err;
                });
            $scope.user = { username: "", password: "", email: "" };
        };
        
    }]);
})();