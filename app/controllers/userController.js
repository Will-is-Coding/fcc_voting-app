'use strict';
(function () {
   angular.module('VotingApp').controller('UserController', [ '$http', '$scope', 'userService', 'pollService', function($http, $scope, userService, pollService) {
       $scope.username = userService.getName();
       $scope.newPoll = { question: "", options: [] };
       $scope.question = '';
       $scope.myPolls = [];
       
       
       function _option() {
           this.placeholder = "Option";
           this.added = false;
           this.button = '+';
           this.optText = '';
       }
       
       $scope.options = [new _option()];
       
       
       $scope.addOpt = function(option, index) {
          option.added = true;
          option.button = "-";

          $scope.options.push(new _option());
       };
       
       $scope.removeOpt = function(option, index) {
          if(index !== -1) {
            $scope.options.splice(index, 1);
          }
       };

       
       $scope.createPoll = function() {
           pollService.createPoll($scope.question, $scope.options);
           $scope.options = [new _option()];
       };
       
       $scope.getMyPolls = function() {
           userService.getMyPolls( function(polls) {
               $scope.myPolls = polls;
               $scope.setupMyPolls();
           });
       };
       
       
       $scope.setupMyPolls = function() {
           for( var i = 0; i < $scope.myPolls.length; i++ ) {
               $scope.myPolls[i].totalVotes = pollService.totalVotes($scope.myPolls[i]);
               $scope.myPolls[i].displayPoll = false;
           }
       };
       
       $scope.drawPoll = function(poll, id) {
           console.log(id + " > svg");
           if( $(id + " > svg").length === 0 )
                pollService.buildChart(poll.options, id);
       };
   }]); 
})();