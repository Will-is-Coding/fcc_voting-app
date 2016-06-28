'using strict';
(function() {
  /** TODO: FIX LEGEND CLICKING WHEN MULTIPLE CHARTS - ON HOME PAGE 
            TRANSLATION ON X-AXIS TO STOP CUTTING OFF CHART ANY SIZE BUT COL-LG         
  **/
    angular.module('VotingApp').factory('chartFactory', [ function() {
        var service = {};
        var id = 0;
        var path = null;
        var arc = null;
        var pie = null;
        var _data = null;
        
        var hasVotes = function(options) {
          for(var i = 0; i < options.length; i++) {
            if (options[i].count > 0)
              return true;
          }
          return false;
        };
        
        var svgCreation = function(data, id, widthRatio) {
            var width = $(id).width(), height = 400;
            var pieWidth = 360, pieHeight = 360;
            var radius = Math.min(width, height) / 2;
          
            var color = d3.scale.category20();

            var svg = d3.select(id)
              .append('svg')
              .attr('width', '100%')
              .attr('height', '100%')
              .attr('viewBox', '0 0 ' + width + ' ' + height)
              .attr('preserveAspectRatio', 'xMinYMin')
              .append('g')
              .attr("transform", "translate(" + (width/2.5) + "," + (radius) +")");
            
            arc = d3.svg.arc()
                .outerRadius(radius);
            
            pie = d3.layout.pie()
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
            
            path = svg.selectAll('path')
                .data(pie(data))
                .enter()
                .append('path')
                //.attr('d', arc)
                //.attr('fill', function(d, i) {
                //  return color(d.data.vote);
                //})
                //.each(function(d) { this._current = d; });
                
            path.transition()
                .duration(500)
                .attr("fill", function(d, i) {
                    return color(d.data.vote);
                })
                .attr('d', arc)
                .each(function(d) {
                    this._current = d;
                });
            
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
        
        service.createChart = function(options, id, widthRatio) {
          if(!hasVotes(options))
            var data = [{vote:"No Votes", count: 1}];
          else
            data = options;
          
          data.forEach(function(d) { d.enabled = true; });
          _data = data;
          svgCreation(data, id, widthRatio);
          
        };
        
        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) {
                return arc(i(t));
            };
        }
        
        service.addVote = function(userVote) {
            for( var i = 0; i < _data.length; i++ ) {
                if (_data[i].vote === userVote.vote) {
                    _data[i].count += 1;
                    path.data(pie(_data));
                    path.transition().duration(750).attrTween("d", arcTween);
                }
            }
        };
        
        return service;
    }]);
})();