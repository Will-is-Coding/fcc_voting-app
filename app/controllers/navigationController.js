'use strict';
angular.module('VotingApp').controller('NavigationController', ['userService', '$scope', 'menuService', '$http', function(userService, $scope, menuService, $http) {
    menuService.setTabs();
    $scope.tabs = menuService.getTabs();
    menuService.subscribe($scope, function tabsChanged() {
        console.log('called back');
        $scope.tabs = menuService.getTabs();
    });
    
}]);