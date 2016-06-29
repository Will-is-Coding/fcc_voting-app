'use strict';
(function() {
    angular.module('VotingApp').controller('NavigationController', ['$scope', '$location', 'navService', function($scope, $location, navService) {
        $scope.loggedIn = false;
        $scope.username = navService.username;
        
        var setUsername = function(error, username) {
           if( error )
                throw error;
            else {
                $scope.loggedIn = true;
                $scope.username = username;
            }
        };
        navService.subscribe($scope, setUsername);
        navService.getUsername(setUsername);

        
        /** For the main navigation tabs, setting the correct tab with the class 'active' **/
        $scope.isActive = function(url) {
            return url === $location.path();
        };

        
    }]);
})();