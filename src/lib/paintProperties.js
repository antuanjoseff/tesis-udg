const clusterColor = "#CA6D51";

const clusters = {
  // "circle-color": [
  //   "case",
  //   [">", ["to-number", ["get", "tesis"]], 1000],
  //   "#bd0026",
  //   [">", ["to-number", ["get", "tesis"]], 30],
  //   "#f03b20",
  //   [">=", ["to-number", ["get", "tesis"]], 5],
  //   "#fd8d3c",
  //   [">=", ["to-number", ["get", "tesis"]], 4],
  //   "#feb24c",
  //   [">=", ["to-number", ["get", "tesis"]], 2],
  //   "#fed976",
  //   [">=", ["to-number", ["get", "tesis"]], 1],
  //   "#ffffb2",
  //   "#fff0",
  // ],
  "circle-color": clusterColor,
  "circle-radius": ["step", ["get", "tesis"], 15, 100, 20, 750, 30],
  "circle-opacity": 0.8,
  "circle-stroke-color": clusterColor,
  "circle-stroke-opacity": 0.7,
  "circle-stroke-width": 10,
};

const countries = {
  "fill-color": [
    "case",
    [">", ["to-number", ["get", "tesis"]], 1000],
    "#bd0026",
    [">", ["to-number", ["get", "tesis"]], 30],
    "#f03b20",
    [">=", ["to-number", ["get", "tesis"]], 5],
    "#fd8d3c",
    [">=", ["to-number", ["get", "tesis"]], 4],
    "#feb24c",
    [">=", ["to-number", ["get", "tesis"]], 2],
    "#fed976",
    [">=", ["to-number", ["get", "tesis"]], 1],
    "#ffffb2",
    "#fff0",
  ],
  "fill-opacity": 0.8,
};

export { clusters, countries };
