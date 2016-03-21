'use strict';
(function() {
    //Use angular router?
    angular.module('VotingApp').controller('IndexController', ['$http', '$log', function($http, $log) {
        var ctrl = this;
        ctrl.polls = [];
        $http({method: 'GET', url: '/api/fetchpolls'}).success( function(data) {
           ctrl.polls = data;
           console.log(ctrl.polls);
        })
        .error( function(err) {
            if (err) throw err;
        });
    }]);
})();