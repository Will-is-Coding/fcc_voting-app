'use strict';
//TODO: Form verification
(function() {
    angular.module('VotingApp').controller('LoginController', [ '$http', '$scope', '$location', 'userService', 'menuService', function($http, $scope, $location, userService, menuService) {
        $scope.user = { username: "", password: ""};
        
        $scope.attemptLogin = function(user) {
            console.log(user);
            $http({ method: 'POST', url: '/api/authenticate', data: JSON.stringify(user) })
                .then( function successCB(response) {
                    if( response.status === 200 && response.data.success === true) {
                        userService.setName(response.data.username);
                        menuService.notify();
                        $scope.username = userService.getName();
                        $location.path('/');
                    }
                    else if ( response.data.success === false ) {
                        console.log(response.data.message);
                    }
                },
                function errorCB(error) {
                    throw error;
                });
        };
    }]);
})();