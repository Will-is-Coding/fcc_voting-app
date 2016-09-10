'use strict';
(function() {
    angular.module('VotingApp').service('navService', ['$http', '$rootScope', 'userService', function($http, $rootScope, userService) {
        var username = '';
        
        this.getUsername = function( callback ) {
            userService.requestUsername( callback );
        };
        
        
        this.subscribe = function(scope, callback) {
            var handler = $rootScope.$on('logging-in', function() {
                userService.getUsername( callback );
            });
            scope.$on('$destroy', handler);
        };
        
        this.notify = function() {
            $rootScope.$emit('logging-in');
        };
        
    }]);
})();