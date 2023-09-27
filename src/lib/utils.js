const getRandomColor = () => {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

function getArrayDepth(value) {
  return Array.isArray(value)
    ? 1 + Math.max(0, ...value.map(getArrayDepth))
    : 0;
}

const getBbox = (geometry) => {
  console.log(getArrayDepth(geometry.coordinates));
  let xmin, ymin, xmax, ymax;
  console.log(geometry);
  if (getArrayDepth(geometry.coordinates) === 3) {
    xmin = geometry.coordinates[0][0][0];
    xmax = geometry.coordinates[0][0][0];
    ymin = geometry.coordinates[0][0][1];
    ymax = geometry.coordinates[0][0][1];
    geometry.coordinates.forEach((polygon) => {
      polygon.forEach((c) => {
        if (c[0] < xmin) xmin = c[0];
        if (c[0] > xmax) xmax = c[0];
        if (c[1] < ymin) ymin = c[1];
        if (c[1] > ymax) ymax = c[1];
      });
    });
  } else {
    xmin = geometry.coordinates[0][0][0][0];
    xmax = geometry.coordinates[0][0][0][0];
    ymin = geometry.coordinates[0][0][0][1];
    ymax = geometry.coordinates[0][0][0][1];
    geometry.coordinates.forEach((multipolygon) => {
      multipolygon.forEach((polygon) => {
        polygon.forEach((c) => {
          if (c[0] < xmin) xmin = c[0];
          if (c[0] > xmax) xmax = c[0];
          if (c[1] < ymin) ymin = c[1];
          if (c[1] > ymax) ymax = c[1];
        });
      });
    });
  }
  console.log([xmin, ymin, xmax, ymax]);
  return [xmin, ymin, xmax, ymax];
};

const getCountryGeometry = (countriesData, code) => {
  const index = countriesData.features.findIndex((feature, idx) => {
    return countriesData.features[idx].properties.adm0_a3 === code;
  });

  if (index) {
    return countriesData.features[index].geometry;
  } else {
    return undefined;
  }
};

export { getRandomColor, getBbox, getCountryGeometry };
