'use strict';
(function() {
    angular.module('VotingApp').controller("FooterController", ["$scope", "$anchorScroll", function($scope, $anchorScroll) {
        $scope.goToTop = function() {
            //$anchorScroll('main-display');
            $("html, body").animate({ scrollTop: 0 }, "slow");
        };
    }]);
})();