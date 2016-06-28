'use strict';
(function() {
    angular.module('VotingApp').service('navService', ['$http', 'userService', function($http, userService) {
        this.getUsername = function( callback ) {
            userService.requestUsername( callback );
        };
        
    }]);
})();