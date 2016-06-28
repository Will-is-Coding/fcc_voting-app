'use strict';
(function() {
    //Use angular router?
    angular.module('VotingApp').controller('AllPollsController', ['$http', '$log', '$scope', 'userService', 'pollService', function($http, $log, $scope, userService, pollService) {
        $scope.allPolls = [];
        $scope.loggedIn = false;
        $scope.userNewOption = "";
        //$scope.userVote = '';
        var chartWidthRatio = 3;
        
        var setupPolls = function() {
            for( var i = 0; i < $scope.allPolls.length; i++ ) {
                $scope.allPolls[i].totalVotes = pollService.totalVotes($scope.allPolls[i]);
                $scope.allPolls[i].displaying = false;
                $scope.allPolls[i].userVote = $scope.allPolls[i].options[0];
            }
        };
        
        
        var checkUserStatus = function() {
            if( userService.getUsername() === '' )
                $scope.loggedIn = false;
            else
                $scope.loggedIn = true;
        };
        checkUserStatus();
        
        var getAllPolls = function() {
            $http({method: 'GET', url: '/api/fetchpolls'}).success( function(data) {
               $scope.allPolls = data;
               setupPolls();
            })
            .error( function(err) {
                if (err) throw err;
            });
        };
        getAllPolls();
        
        
        $scope.displayPoll = function(poll, id) {
            var pollData = poll.options;
            poll.displaying = !poll.displaying;
            
            if( $(id + " > svg").length === 0 )
                pollService.buildChart(pollData, id, chartWidthRatio);
        };
        
        $scope.vote = function(userVote, pollID) {
            console.log(userVote + ' ' + pollID);
            pollService.submitVote(userVote, pollID);
        };
        
        $scope.addOption = function(newOpt, poll) {
            pollService.addOption(newOpt, poll);
        };
    }]);
})();