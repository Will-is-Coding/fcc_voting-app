'use strict';

(function() {
    angular.module('VotingApp').controller('SignupController', [ '$http', '$scope', function($http, $scope) {
        $scope.newUser = { username: "", password: "", email: "" };
        
        $scope.attemptSignup = function(newUser) {
            console.log(newUser);
            $http({ method: 'POST', url: 'api/signup', data: JSON.stringify(newUser) })
                .success( function(err, data) {
                    if (err)
                        throw err;
                })
                .error( function(err) {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                });
            $scope.user = { username: "", password: "", email: "" };
        };
    }]);
})();