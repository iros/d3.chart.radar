/* global d3 */
(function() {

  var data = [
    { name : "series1", values : [
      { axis : "a", value : 5 },
      { axis : "b", value : 20 },
      { axis : "c", value : 30 },
      { axis : "d", value : 20 },
      { axis : "e", value : 50 }
    ]},

    { name : "series2", values : [
      { axis : "a", value : 5 },
      { axis : "b", value : 30 },
      { axis : "c", value : 12 },
      { axis : "d", value : 24 },
      { axis : "e", value : 11 }

    ]}
  ];

  // different chart versions

  var status = d3.select("#status");

  var onModeChange = function() {
    status.text("Mode changed to: " + this.mode());
  };

  var radar = d3.select("#vis")
    .append("svg")
    .chart("Radar")
    .levels(7)
    .width("100%")
    .height(500);

  radar.draw(data);
  radar.on("mode:change", onModeChange);

  var radar2 = d3.select("#vis2")
    .append("svg")
    .chart("Radar")
    .levels(5)
    .width(200)
    .height(200);

  radar2.draw(data);

  var radar3 = d3.select("#vis3")
    .append("svg")
    .chart("Radar")
    .levels(10)
    .width(300)
    .height("80%");

  radar3.draw(data);
}());