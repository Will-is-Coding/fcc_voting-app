'use strict';
(function() {
    angular.module('VotingApp').controller('NavigationController', ['$scope', '$location', 'userService', function($scope, $location, userService) {
        $scope.loggedIn = false;
        $scope.username = '';
        
        var setUsername = function() {
            userService.getUsername(function(err, username) {
                if( err )
                    console.log(err);
                else {
                    $scope.username = username;
                    $scope.loggedIn = true;
                }
            });
        };
        setUsername();
        
        //menuService.setTabs();
        //$scope.tabs = menuService.getTabs();
        /*menuService.subscribe($scope, function tabsChanged() {
            console.log('called back');
            $scope.tabs = menuService.getTabs();
        });*/
        
        /** For the main navigation tabs, setting the correct tab with the class 'active' **/
        $scope.isActive = function(url) {
            return url === $location.path();
        };

        
    }]);
})();