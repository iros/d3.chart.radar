/* global d3 */

/**
* Radar chart
* Expected data format:
* [
*   { name : "series1", values : [
*     { axis : "axisname", value: 30 },
*     { axis : "anotheraxis", value: 40 }]
*   },
*   { name : "series2", values : [
*     { axis : "axisname", value: 130 },
*     { axis : "anotheraxis", value: 50 }
*   ]
* ]
**/
(function(d3) {


  function __cartesianToPolar(n, length, fn, total) {
    return length * fn(n * (2 * Math.PI / total));
  }

  function _getVerticalPosition(n, length, total) {
    return __cartesianToPolar(n, length, Math.cos, total);
  }

  function _getHorizontalPosition(n, length, total) {
    return __cartesianToPolar(n, length, Math.sin, total);
  }

  function _positionLine(line, r, total) {
    line.attr("x1", function(d, i) {
        return _getHorizontalPosition(i, r, total);
      })
      .attr("y1", function(d, i) {
        return _getVerticalPosition(i, r, total);
      })
      .attr("x2", function(d, i) {
        return _getHorizontalPosition(i + 1, r, total);
      })
      .attr("y2", function(d, i) {
        return _getVerticalPosition(i + 1, r, total);
      });
  }

  function _positionBeam(line, j, r, total) {
    line.attr("x2", function(d, i) {
      return _getHorizontalPosition(j, r, total);
    })
    .attr("y2", function(d, i) {
      return _getVerticalPosition(j, r, total);
    });
  };

  d3.chart("BaseChart").extend("Radar", {
    modes : {
      mobile : function() {
        return Modernizr.mq("only all and (max-width: 480px)");
      },
      tablet: function() {
        return Modernizr.mq("only all and (min-width: 481px) and (max-width: 768px)");
      },
      web: function() {
        return Modernizr.mq("only all and (min-width: 769px)");
      }
    },

    initialize: function() {

      var chart = this;

      chart.state = {};

      chart.scales = {
        radius: d3.scale.linear(),
        color: d3.scale.category10()
      };
      
      // ==== bases ====
      // grid
      var gridBase = this.base.append("g")
        .classed("grid", true)
        .style("height", chart.height())
        .style("width", chart.width());

      // series
      var seriesBase = this.base.append("g")
        .classed("series", true)
        .style("height", chart.height())
        .style("width", chart.width());

      // add grid
      chart.layer("grid", gridBase, {
        modes: ["mobile","tablet","web"],

        dataBind: function(data) {
          return this.selectAll("g")
            .data(chart.state.allAxis);
        },

        insert: function() {
          return this.append("g")
            .classed("grid-lines", true)
            .attr("transform", "translate(" +
                  chart.state.center.x + "," +
                  chart.state.center.y + ")");
        },

        events: {
          update: function() {

            // recenter
            this.attr("transform", "translate(" +
                  chart.state.center.x + "," +
                  chart.state.center.y + ")");
          },
          enter: function() {

            var chart = this.chart();
            var total = chart.state.allAxis.length;
            var r;

            // draw surrounding polygons for all levels
            for(var i = 0; i < chart.state.levels; i++) {

              // calculate the radius for the specific polygon
              r = ((i + 1) * chart.state.maxRadius / chart.state.levels);

              // create lines for every level
              var line = this.append("line")
                .style("stroke", "lightgrey")
                .style("fill","none");

              _positionLine(line, r, total);
            }

            // also draw an axis
            this.append("line")
              .classed("grid-line", true)
              .style("stroke", "lightgrey")
              .style("fill","none")
              .attr("x1", 0)
              .attr("y1", 0)
              .attr("x2", function(d, i) {
                return _getHorizontalPosition(i, r, total);
              })
              .attr("y2", function(d, i) {
                return _getVerticalPosition(i, r, total);
              });

            // also show values along the axis
            var rangeScale = d3.scale.linear()
              .domain([0, chart.state.levels])
              .range([chart.state.min, chart.state.max]);

            // compute the max radius we are working with
            // since it's not the full max radius, but rather
            // the point on the line bisecting the circle
            var rangeMaxRadius = chart.state.maxRadius * Math.cos(
              ((360 / chart.state.allAxis.length / 2) / 360) *
              2 * Math.PI // to radians
            );
            var rangeRadiusScale = d3.scale.linear()
              .domain(chart.scales.radius.domain())
              .range([0, rangeMaxRadius]);

            var val;
            for(var j = 1; j <= chart.state.levels; j++) {
              val = rangeScale(j); // value to render relative to our levels
              r = rangeRadiusScale(val); //the radius value

              this.append("text")
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("font-weight",100)
                .style("font-family", "'Helvetica Neue', Helvetica, Arial,sans-serif")
                .style("alignment-baseline", "middle")
                .attr("x", _getHorizontalPosition(0, r, chart.state.levels))
                .attr("y", _getVerticalPosition(0, -r, chart.state.levels))
                .text(d3.format(".0f")(val));

            }

          }
        }
      });
      
      chart.layer("series", seriesBase, {
        modes: ["web", "mobile","tablet"],
        dataBind: function(data) {
          return this.selectAll("g")
            .data(data, function(d) { return d.name; });
        },

        insert: function() {
          return this.append("g")
            .classed("series", true);
        },
        events: {
          update: function() {
            this.attr("transform", "translate(" +
                  chart.state.center.x + "," +
                  chart.state.center.y + ")");
          },
          enter: function() {
            var groupContainer = this.attr("transform", "translate(" +
                  chart.state.center.x + "," +
                  chart.state.center.y + ")");

            groupContainer.each(function(d, i) {
              
              // draw circles

              var base = d3.select(groupContainer[0][i]);
                var lineContainer = base.append("g")
                  .classed("lines", true);
                var circleContainer = base.append("g")
                  .classed("circles", true);

              for(var j = 0; j < d.values.length; j++) {

                // find two connector points
                var r_value = d.values[j].value,
                  next_r_value, next_index;
                if (j + 1 < d.values.length) {
                  next_index = j+1;
                } else {
                  next_index = 0;
                }
                next_r_value = d.values[next_index].value;

                // calculate the radius for the specific polygon
                var r = chart.scales.radius(r_value),
                  next_r = chart.scales.radius(next_r_value);

                // create lines for every level

                // == lines
                var line = lineContainer.append("line")
                  .classed("line", true)
                  .style("stroke", chart.scales.color(i))
                  .style("stroke-width", "3px")
                  .style("fill","none");

                line.attr("x1", _getHorizontalPosition(j,r,
                    d.values.length))
                  .attr("y1", _getVerticalPosition(j,r,
                    d.values.length))
                  .attr("x2", _getHorizontalPosition(next_index,next_r,
                    d.values.length))
                  .attr("y2", _getVerticalPosition(next_index,next_r,
                    d.values.length));
                
                // == circles
                var circle = circleContainer.append("circle")
                  .classed("circle", true)
                  .style("stroke", chart.scales.color(i))
                  .style("fill","#fff")
                  .attr("r", 3);
                
                circle.attr("cx", _getHorizontalPosition(j,r,
                  d.values.length));

                circle.attr("cy", _getVerticalPosition(j,r,
                  d.values.length));

              }

            });
          }
        }
      });
    },

    /**
    * Number of levels to show on the grid
    */
    levels : function(newLevels) {
      if (arguments.length === 0) {
        return this.state.levels;
      }

      this.state.levels = newLevels;

      this.trigger("change:levels", this.state.levels);
      
      if (this.data) {
        this.draw(this.data);
      }

      return this;
    },

    /**
    * Builds state:
    * chart.state = {
    *   max : #, // data max
    *   min : #, // data min
    *   allAxis : [], // name of all axis
    * }
    *
    */
    transform: function(data) {

      var chart = this;

      chart.data = data;

      // --- build state ----
      // get series
      chart.state.series = [];
      data.forEach(function(datum) {
        chart.state.series.push(datum.name);
      });

      // Grid center
      chart.state.center = {
        x : chart.width() / 2,
        y : chart.height() / 2
      };

      chart.state.maxRadius = Math.min(chart.width(), chart.height()) / 2;

      // get min/max data values
      chart.state.max = 0;
      chart.state.min = Infinity;

      data.forEach(function(datum) {

        chart.state.min = d3.min([chart.state.min,
                d3.min(datum.values, function(d) { return d.value; })]);
        chart.state.max = d3.max([chart.state.max,
                d3.max(datum.values, function(d) { return d.value; })]);
      });

      chart.state.allAxis = Object.keys(data[0].values);

      // set the chart min to be at least 0
      chart.state.min = d3.min([0, chart.state.min]);

      chart.scales.radius
        .domain([chart.state.min, chart.state.max])
        .range([0, chart.state.maxRadius ]); // max radius is 50% of screen
      

      return data;
    }

  });
}(window.d3));
