'using strict';
(function() {
  /** TODO: FIX SIZING ON ALL WEBPAGE WIDTHS        
  **/
    angular.module('VotingApp').factory('chartFactory', [ function() {
        var chart = {};
        var legendRectSize = 18;
        var legendSpacing = 4;
        
        var hasVotes = function(options) {
          for(var i = 0; i < options.length; i++) {
            if (options[i].count > 0)
              return true;
          }
          return false;
        };
        
        //Width lg: 653px, md: 536px, sm: 720, xs: 698
        var heightFromWidth = {
        };
        
        var svgCreation = function(data, id, poll) {
          console.log(id);
          
          var width = $(id).width(), height = 400;
          
          poll.chart.radius = Math.min(width, height) / 2;
          poll.chart.color = d3.scale.category20();
  
          poll.chart.svg = d3.select(id)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', '0 0 ' + width  + ' ' + width / 1.5)
            .attr('preserveAspectRatio', 'xMinYMin')
            .append('g')
            .attr("transform", "translate(" + (width/2.5) + "," + (poll.chart.radius) +")");
          
          poll.chart.arc = d3.svg.arc()
              .outerRadius(poll.chart.radius);
          
          poll.chart.pie = d3.layout.pie()
              .value(function(d) { return d.count; })
              .sort(null);
          
          var ttip = d3.select(id)
              .append('div')
              .attr('class', 'ttip');
          
          ttip.append('div')
              .attr('class', 'vote');
          
          ttip.append('div')
              .attr('class', 'count');
          
          ttip.append('div')
              .attr('class', 'percent');
              
          poll.chart.path = poll.chart.svg.selectAll('path')
              .data(poll.chart.pie(data))
              .enter()
              .append('path');
              
          poll.chart.path.transition()
              .duration(500)
              .attr("fill", function(d, i) {
                  return poll.chart.color(d.data.vote);
              })
              .attr('d', poll.chart.arc)
              .each(function(d) {
                  this._current = d;
              });
          
          poll.chart.path.on('mouseover', function(d) {
              var total = d3.sum(data.map(function(d) {
                return (d.enabled) ? d.count : 0;
              }));
          
              var percent = Math.round(1000 * d.data.count/total) / 10;
              
              ttip.select('.vote').html(d.data.vote);
              
              if( d.data.vote !== "No Votes") {
                ttip.select('.count').html(d.data.count + ' vote(s)');
                ttip.select('.percent').html(percent + "%");
              }
              
              ttip.style('display', 'block');
          });
          
          poll.chart.path.on('mouseout', function(d) {
              ttip.style('display', 'none');
          });
          
          poll.chart.path.on('mousemove', function(d) {
              ttip.style('top', (d3.event.layerY + 10) + 'px')
                .style('left', (d3.event.layerX + 10) + 'px');
          });
          
          
          poll.chart.legend = poll.chart.svg.selectAll('.legend')
              .data(poll.chart.color.domain())
              .enter()
              .append('g')
              .attr('class', 'legend')
              .attr('transform', function(d, i) {
  
                var height = legendRectSize + legendSpacing;
                var vert = -poll.chart.radius + ( i * height);
                var horz = poll.chart.radius + legendSpacing + 25;
                return 'translate(' + horz + ',' + vert +')';
              })
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
                
                poll.chart.pie.value(function(d) { 
                  if (d.vote === vote) d.enabled = enabled;
                  return (d.enabled) ? d.count : 0;
                });
                
                poll.chart.path = poll.chart.path.data(poll.chart.pie(data));
                
                poll.chart.path.transition()
                  .duration(750)
                  .attrTween('d', function(d) {
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                      return poll.chart.arc(interpolate(t));
                    };
                  });
              });
          
            poll.chart.legend.append('rect')
              .attr('width', legendRectSize)
              .attr('height', legendRectSize)
              .style('fill', poll.chart.color)
              .style('stroke', poll.chart.color);
              
          
           poll.chart.legend.append('text')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function(d) { return d; });
              
        };
        
        chart.createChart = function(poll, id) {
          if(!hasVotes(poll.options))
            var data = [{vote:"No Votes", count: 1}];
          else
            data = poll.options;
          
          data.forEach(function(d) { d.enabled = true; });

          svgCreation(data, id, poll);
        };
        

        chart.addVote = function(userVote, poll ) {

            var data = poll.options;
            console.log(data);
            var svg = poll.chart.svg;
            var color = poll.chart.color;
            var legend = poll.chart.legend;
            var pie = poll.chart.pie;
            var path = poll.chart.path;
            var arc = poll.chart.arc;
            var radius = poll.chart.radius;
            
            //If first vote for the poll, reset the color & its domain(the votes) then remove the 'No Votes' legend
            if( !hasVotes(data) ) {
              color = d3.scale.category20();
              legend = svg.selectAll('.legend').remove();
            }
            
            for( var i = 0; i < data.length; i++ ) {
                color(data[i].vote);
                if (data[i].vote === userVote) {
                  if( !hasVotes(data) ) {
                    data[i].count += 1;
                    path.data(pie([data[i]]));
                  }
                  else {
                    data[i].count += 1;
                    path.data(pie(data));
                  }
                }
            }

            path.transition()
              .duration(750)
              .attr("fill", function(d) {
                return color(d.data.vote);
              })
              .attrTween('d', function(d) {
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                  return arc(interpolate(t));
                };
              });

            legend = svg.selectAll('.legend')
                .data(color.domain())
                .enter()
                .append('g')
                .attr('class', 'legend')
                .attr('transform', function(d, i) {
                  var height = legendRectSize + legendSpacing;
                  var vert = -radius + ( i * height);
                  var horz = radius + legendSpacing + 25;
                  return 'translate(' + horz + ',' + vert +')';
              });

              legend.append('rect')
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .style('fill', color)
                .style('stroke', color);
                
              legend.append('text')
              .attr('x', legendRectSize + legendSpacing)
              .attr('y', legendRectSize - legendSpacing)
              .text(function(d) { return d; });
        };
        
        //TODO: If user votes for new option after adding, make it display
        chart.addOption = function(newOpt, poll) {

          if( hasVotes(poll.options) ) {
            
            poll.chart.color(newOpt);
            
            poll.chart.legend = poll.chart.svg.selectAll('.legend')
                  .data(poll.chart.color.domain())
                  .enter()
                  .append('g')
                  .attr('class', 'legend')
                  .attr('transform', function(d, i) {
                    var height = legendRectSize + legendSpacing;
                    var vert = -poll.chart.radius + ( i * height);
                    var horz = poll.chart.radius + legendSpacing + 25;
                    return 'translate(' + horz + ',' + vert +')';
                });
              
                poll.chart.legend.append('rect')
                  .attr('width', legendRectSize)
                  .attr('height', legendRectSize)
                  .style('fill', poll.chart.color)
                  .style('stroke', poll.chart.color);
                  
              
              poll.chart.legend.append('text')
                .attr('x', legendRectSize + legendSpacing)
                .attr('y', legendRectSize - legendSpacing)
                .text(function(d) { return d; });
          }
        };
        
        return chart;
    }]);
})();