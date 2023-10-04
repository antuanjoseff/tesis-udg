const clusterColor = "#CA6D51";
const unclusterColor = "#CACA51";

const uncluster = {
  'circle-color': unclusterColor,
  "circle-opacity": 0.8,
  "circle-stroke-color": unclusterColor,
  "circle-stroke-opacity": 0.7,
  "circle-stroke-width": 10,  
  'circle-radius': [
      'step',
      ['get', 'tesis'],
      20,
      100,
      30,
      750,
      40
  ]
}

const clusters = {
  'circle-color': clusterColor,
  "circle-opacity": 0.8,
  "circle-stroke-color": clusterColor,
  "circle-stroke-opacity": 0.7,
  "circle-stroke-width": 10,  
  'circle-radius': [
      'step',
      ['get', 'sum'],
      20,
      100,
      30,
      750,
      40
  ]
}

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

export { uncluster, clusters, countries };
