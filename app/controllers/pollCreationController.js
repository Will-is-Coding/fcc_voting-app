'use strict';
( function() {
    angular.module('VotingApp').controller('PollCreationController', ['$scope', '$http', 'pollService', function($scope, $http, pollService) {
        $scope.poll = '';
        $scope.secret= false;
        $scope.draft = false;
        $scope.created = false;
        
        function _option() {
            this.added = false;
            this.optText = '';
        }
        
        $scope.options = [new _option(), new _option()];
        
        var isUniqueOption = function(option) {
            for( var i = 0; i < $scope.options.length; i++ ) {
                if( $scope.options[i].optText.toLowerCase() === option.toLowerCase() && $scope.options[i].added )
                    return false;
            }
            
            return true;
        };
       
        $scope.addOpt = function(option, index) {
            if( option.optText.length > 0 && isUniqueOption(option.optText) ) {
                option.added = true;
                if( index !== 0 )
                    $scope.options.push(new _option());
            }
        };
        
        $scope.removeOpt = function(option, index) {
            if(index !== -1 ) {
                $scope.options.splice(index, 1);
                if( $scope.options.length < 2 )
                    $scope.options.push(new _option());
            }
        };
        
        var cleanOptions = function() {
            for( var i = 0; i < $scope.options.length; i++ ) {
                if( $scope.options[i].optText !== '' && $scope.options[i].optText.length > 0 && $scope.options[i].added )
                    $scope.options[i] = $scope.options[i].optText;
                else
                    $scope.options.splice(i, 1);
            }
        };
        
        $scope.createPoll = function() {
            cleanOptions();
            if( $scope.poll.length > 0 && $scope.options.length > 1 ) {
                pollService.createPoll($scope.poll, $scope.options, $scope.secret, $scope.draft);
                $scope.options = [new _option()];
                $scope.created = true;
            }
            else {
                console.log('Error!');
            }
        };
       
    }]);
})();