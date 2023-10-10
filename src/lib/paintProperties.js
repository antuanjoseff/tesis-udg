const clusterColor = "#CA6D51";
const unclusterColor = "#aadD51";

const uncluster = {
  "circle-color": unclusterColor,
  "circle-opacity": 0.8,
  "circle-stroke-color": unclusterColor,
  "circle-stroke-opacity": 0.7,
  "circle-stroke-width": 10,
  "circle-radius": ["step", ["get", "tesis"], 20, 100, 30, 750, 40],
};

const clusters = {
  "circle-color": clusterColor,
  "circle-opacity": 0.8,
  "circle-stroke-color": clusterColor,
  "circle-stroke-opacity": 0.7,
  "circle-stroke-width": 10,
  "circle-radius": ["step", ["get", "sum"], 20, 100, 30, 750, 40],
};

// Menys de 10 tesis>> #F3F6E0
// De 10 a 20 tesis>> #FCE5A2
// De 21 a 60 tesis>> #F9D465
// Més de 60 tesis >> #F6BA08

const countries = {
  "fill-color": [
    "case",
    [">", ["to-number", ["get", "tesis"]], 60],
    "#455DA4",
    [">", ["to-number", ["get", "tesis"]], 21],
    "#6477B0",
    [">=", ["to-number", ["get", "tesis"]], 10],
    "#8492BD",
    "#C5C9D8",
  ],
  "fill-opacity": 0.8,
};

export { uncluster, clusters, countries };
