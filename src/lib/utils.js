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
  let xmin, ymin, xmax, ymax;

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

const getCountryAbstract = (tesis_list, code) => {
  var total = 0
  var abstract = {}
  tesis_list.forEach((tesis) => {
     if (tesis.iso3 === code){
       total += 1
       if (tesis.programa in abstract){
        abstract[tesis.programa] += 1
      } else {
        abstract[tesis.programa] = 1
      }
    } 
  });
  // Create a table to sort it later
  abstract =  Object.entries(abstract)
  return {total, abstract}
};

const formatPopup = (obj) => {
  function sortFunction(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? 1 : -1;
    }
  }
  var html = '<table>'
  if (typeof(obj) === "string") {
    const base = (JSON.parse(obj))
    // Sort table 
    base.sort(sortFunction)
    base.forEach(function(programa) {
      html += `<tr><td>${programa[0]}</td><td>${programa[1]}</td></tr>`
    })
  }
  html += '</table>'
  return html
}

export { 
  getRandomColor,
  getBbox,
  getCountryGeometry,
  getCountryAbstract,
  formatPopup
};
