'use strict';
(function () {
   angular.module('VotingApp').controller('UserController', [ '$http', '$scope', 'userService', function($http, $scope, userService) {
       $scope.username = userService.getName();
       $scope.test = "Yeehaw";
   }]); 
})();