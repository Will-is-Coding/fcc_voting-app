(function() {
    
    angular.module('VotingApp').controller('PollController', ['$http', '$routeParams', '$scope', function($http, $routeParams, $scope) {
        var controller = this;
        this.myVote = {};
        
        /**On load get the specific poll's data **/
        $http({ method:'GET', url: '/api/poll/' + $routeParams.id })
            .success( function(data) {
                controller.poll = data;
                controller.myVote = data.options[0]; //Set the initial value so no blank option
            })
            .error( function(err) {
                if (err) throw err;
            });
            
        /** Save the user's vote to the specificed poll **/
        this.addVote = function(userVote) {
            this.voteData = JSON.stringify({ _id: this.poll._id, vote: userVote });
            userVote.count += 1; //Or GET /api/poll ?
            $http({ method: 'PUT', url: '/api/poll/' + $routeParams.id, data: controller.voteData })
                .error( function(err) { if (err) throw err;});
        };
        
    }]);
})();