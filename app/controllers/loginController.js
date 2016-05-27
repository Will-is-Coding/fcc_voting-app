'use strict';

(function() {
    angular.module('VotingApp').controller('LoginController', [ '$http', '$scope', '$location', 'userService', 'menuService', function($http, $scope, $location, userService, menuService) {
        $scope.user = { username: "", password: ""};
        
        $scope.attemptLogin = function(user) {
            console.log(user);
            $http({ method: 'POST', url: '/api/authenticate', data: JSON.stringify(user) })
                .success( function(data, status) {
                    if( status === 200 ) {
                        console.log(data);
                        userService.setName(data.user.username);
                        menuService.notify();
                        $scope.username = userService.getName();
                        $location.path('/#/');
                    }
                })
                .error( function (data) {
                    throw data;
                });
            $scope.user = { username: "", password: "" };
        };
    }]);
})();