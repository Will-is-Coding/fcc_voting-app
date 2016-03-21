'use strict';

(function() {
    angular.module('VotingApp').controller('LoginController',[ '$http', '$scope', function($http, $scope) {
        $scope.user = { username: "", password: "", email: "" };
        
        $scope.attemptLogin = function(user) {
            console.log(user);
            $http({ method: 'POST', url: '/api/login', data: JSON.stringify(user)})
                .success( function(err, data) {
                    if (err)
                        throw err;
                });
            $scope.user = { username: "", password: "", email: "" };
        };
    }]);
})();