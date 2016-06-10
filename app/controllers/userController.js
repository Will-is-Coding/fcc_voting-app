'use strict';
(function () {
   angular.module('VotingApp').controller('UserController', [ '$http', '$scope', 'userService', 'pollService', function($http, $scope, userService, pollService) {
       $scope.username = userService.getName();
       $scope.newPoll = { question: "", options: [] };
       $scope.question = '';
       $scope.options = [{placeholder: "Option", added: false, button: '+', optText: ''}];
       
       
       $scope.addOpt = function(option, index) {
          option.added = true;
          option.button = "-";
          console.log(index);

          $scope.options.push({
             placeholder: option.placeholder,
             added: false,
             button: '+',
             optText: ''
          });
       };
       
       $scope.removeOpt = function(option, index) {
          if(index !== -1) {
            $scope.options.splice(index, 1);
          }
       };

       
       $scope.createPoll = function() {
           pollService.createPoll($scope.question, $scope.options, 'testUsername' );
           $scope.options = [{placeholder: "Option", added: false, button: '+', vote: ''}];
       };
   }]); 
})();