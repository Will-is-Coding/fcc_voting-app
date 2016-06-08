(function() {
    
    angular.module('VotingApp').controller('PollController', ['$http', '$routeParams', '$scope', function($http, $routeParams, $scope) {
        var controller = this;
        this.myVote = {};
        
        function hasVotes(options) {
          for(var i = 0; i < options.length; i++) {
            if (options[i].count > 0)
              return true;
          }
          return false;
        }
        
        this.createChart = function(options) {
          if(!hasVotes(options))
            var data = [{vote:"No Votes", count: 1}];
          else
            data = options;
          
          data.forEach(function(d) { d.enabled = true; });
          var width = $('.chart-area').width(), height = 400;
          var pieWidth = 360, pieHeight = 360;
          var radius = Math.min(pieWidth, pieHeight) / 2;
          
          var color = d3.scale.category20b();
          
          var svg = d3.select(".chart-area")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + (width/2) + "," + (radius) +")");
            
          var arc = d3.svg.arc()
            .outerRadius(radius);
            
          var pie = d3.layout.pie()
            .value(function(d) { return d.count; })
            .sort(null);
            
          var ttip = d3.select(".chart-area")
            .append('div')
            .attr('class', 'ttip');
          
          ttip.append('div')
            .attr('class', 'vote');
            
          ttip.append('div')
            .attr('class', 'count');
            
          ttip.append('div')
            .attr('class', 'percent');
            
          var path = svg.selectAll('path')
            .data(pie(data))
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', function(d, i) {
              return color(d.data.vote);
            })
            .each(function(d) { this._current = d; });
            
          path.on('mouseover', function(d) {
            var total = d3.sum(data.map(function(d) {
              return (d.enabled) ? d.count : 0;
            }));
            
            var percent = Math.round(1000 * d.data.count/total) / 10;
            ttip.select('.vote').html(d.data.vote);
            ttip.select('.count').html(d.data.count);
            ttip.select('.percent').html(percent + "%");
            ttip.style('display', 'block');
          });
          
          path.on('mouseout', function(d) {
            ttip.style('display', 'none');
          });
          
          path.on('mousemove', function(d) {
            ttip.style('top', (d3.event.layerY + 10) + 'px')
              .style('left', (d3.event.layerX + 10) + 'px');
          });
          
          var legendRectSize = 18;
          var legendSpacing = 4;
          var legendWidth = 40;
          
          var legend = svg.selectAll('.legend')
            .data(color.domain())
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i) {
              //var vert = radius + 15;
              //var horz = -radius + (i * legendWidth);
              var height = legendRectSize + legendSpacing;
              var offset = height * color.domain().length / 2;
              var vert = -radius + ( i * height);
              var horz = radius + legendSpacing + 25;
              return 'translate(' + horz + ',' + vert +')';
            });
            
          legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', color)
            .style('stroke', color)
            .on('click', function(vote) {
              var rect = d3.select(this);
              var enabled = true;
              var totalEnabled = d3.sum(data.map(function(d) {
                return (d.enabled && d.count > 0) ? 1 : 0;
              }));
              
              if (rect.attr('class') === 'disabled') {
                rect.attr('class', '');
              } else {
                if (totalEnabled < 2) return;
                rect.attr('class', 'disabled');
                enabled = false;
              }
              
              pie.value(function(d) { 
                if (d.vote === vote) d.enabled = enabled;
                return (d.enabled) ? d.count : 0;
              });
              
              path = path.data(pie(data));
              
              path.transition()
                .duration(750)
                .attrTween('d', function(d) {
                  var interpolate = d3.interpolate(this._current, d);
                  this._current = interpolate(0);
                  return function(t) {
                    return arc(interpolate(t));
                  };
                });
            });
            
            legend.append('text')
              .attr('x', legendRectSize + legendSpacing)
              .attr('y', legendRectSize - legendSpacing)
              .text(function(d) { return d; });
        };
        
        var deleteChart = function() {
          
        };
        
        this.parseVoteCount = function(poll) {
          var data = [];
          for( var i = 0; i < poll.options.length; i++ ) {
            data.push(poll.options[i].count);
          }
          return data;
        };
        
        /**On load get the specific poll's data **/
        $http({ method:'GET', url: '/api/poll/' + $routeParams.id })
            .success( function(data) {
                controller.poll = data;
                controller.myVote = data.options[0]; //Set the initial value so no blank option
                console.log(data);
                console.log(typeof(data.options[0].count));
                //D3 Json?
                //controller.createChart(controller.parseVoteCount(data));
                controller.createChart(data.options);
            })
            .error( function(err) {
                if (err) throw err;
            });
            
        /** Save the user's vote to the specificed poll **/
        /** Add D3 Event Listener on adding a vote **/
        this.addVote = function(userVote) {
            //TODO: Verify if user, logged in or not(IP) has voted already
            this.voteData = JSON.stringify({ _id: this.poll._id, vote: userVote });
            userVote.count += 1; //Or GET /api/poll ?
            $http({ method: 'PUT', url: '/api/poll/' + $routeParams.id, data: controller.voteData })
                .error( function(err) { if (err) throw err;});
        };
        
    }]);
})();