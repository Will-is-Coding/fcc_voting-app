'use strict';
(function() {
    //Use angular router?
    angular.module('VotingApp').controller('IndexController', ['$http', '$log', 'userService', function($http, $log, userService) {
        var ctrl = this;
        ctrl.polls = [];
        console.log(userService.getName());
        $http({method: 'GET', url: '/api/fetchpolls'}).success( function(data) {
           ctrl.polls = data;
           console.log(ctrl.polls);
        })
        .error( function(err) {
            if (err) throw err;
        });
    }]);
})();