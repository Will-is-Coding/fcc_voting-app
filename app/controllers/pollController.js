(function() {
    
    angular.module('VotingApp').controller('PollController', ['$http', '$routeParams', '$scope', function($http, $routeParams, $scope) {
        var controller = this;
        this.myVote = {};
        
        $http({ method:'GET', url: '/api/poll/' + $routeParams.id })
            .success( function(data) {
                controller.poll = data;
                controller.myVote = data.options[0];
            })
            .error( function(err) {
                if (err) console.log(err); throw err;
            });
        this.addVote = function(userVote) {
            this.voteData = JSON.stringify({ _id: this.poll._id, vote: userVote });
            $http({ method: 'PUT', url: '/api/poll/' + $routeParams.id, data: controller.voteData });
        };
    }]);
})();