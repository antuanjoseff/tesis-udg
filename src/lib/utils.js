import { api } from "src/boot/axios";

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
  let index = -1;
  index = countriesData.features.findIndex((feature, idx) => {
    return countriesData.features[idx].properties.adm0_a3 === code;
  });

  if (index != -1) {
    return countriesData.features[index].geometry;
  } else {
    return undefined;
  }
};

const getCountryAbstract = (tesis_list, code) => {
  var total = 0;
  var abstract = {};
  tesis_list.forEach((tesis) => {
    if (tesis.iso_a3 === code) {
      total += 1;
      if (tesis.programa in abstract) {
        abstract[tesis.programa] += 1;
      } else {
        abstract[tesis.programa] = 1;
      }
    }
  });
  // Create a table to sort it later
  abstract = Object.entries(abstract);
  return { total, abstract };
};

const organizeThesisData = (tesis_list, noName, filter = "") => {
  var result = {};
  var programes = [];
  var data;
  var idxProgram, idxLR;
  var countryNames = [];

  // Filter data if necessary
  if (filter !== "") {
    data = tesis_list.filter((e) => {
      return e.programa.toUpperCase() == filter.toUpperCase();
    });
  } else {
    data = tesis_list;
  }

  data.forEach((tesis) => {
    if (tesis.LiniaRecerca === "") {
      tesis.LiniaRecerca = noName;
    }

    const foundProgram = programes.find((e) => {
      return e.name === tesis.Pla;
    });

    if (!foundProgram) {
      programes.push({
        name: tesis.Pla,
        researchLines: [tesis.LiniaRecerca],
      });
    } else {
      const foundLR = foundProgram.researchLines.find((lr) => {
        return lr === tesis.LiniaRecerca;
      });
      if (!foundLR) {
        foundProgram.researchLines.push(tesis.LiniaRecerca);
      }
    }

    if (tesis.PaisCodi in result) {
      result[tesis.PaisCodi].count += 1;
      // Check if Pla already exists
      const programs = result[tesis.PaisCodi].programs;
      idxProgram = programs.findIndex((p) => {
        return p.name === tesis.Pla;
      });
      if (idxProgram === -1) {
        result[tesis.PaisCodi].programs.push({
          name: tesis.Pla !== "" ? tesis.Pla : "",
          count: 1,
          researchLines: [
            {
              name: tesis.LiniaRecerca !== "" ? tesis.LiniaRecerca : "",
              count: data.LiniaRecerca !== "" ? 1 : 0,
              thesis: [
                {
                  title: tesis.Titol,
                  date: tesis.DataLectura,
                  author: tesis.Doctorand,
                  director: tesis.PrimerDirector,
                },
              ],
            },
          ],
        });
      } else {
        result[tesis.PaisCodi].programs[idxProgram].count += 1;
        //Check if LR already exists
        const LR = result[tesis.PaisCodi].programs[idxProgram].researchLines;
        idxLR = LR.findIndex((lr) => {
          return lr.name === tesis.LiniaRecerca;
        });
        if (idxLR === -1) {
          result[tesis.PaisCodi].programs[idxProgram].researchLines.push({
            name: tesis.LiniaRecerca !== "" ? tesis.LiniaRecerca : "",
            count: data.LiniaRecerca !== "" ? 1 : 0,
            thesis: [
              {
                title: tesis.Titol,
                date: tesis.DataLectura,
                author: tesis.Doctorand,
                director: tesis.PrimerDirector,
              },
            ],
          });
        } else {
          result[tesis.PaisCodi].programs[idxProgram].researchLines[
            idxLR
          ].count += 1;
          result[tesis.PaisCodi].programs[idxProgram].researchLines[
            idxLR
          ].thesis.push({
            title: tesis.Titol,
            date: tesis.DataLectura,
            author: tesis.Doctorand,
            director: tesis.PrimerDirector,
          });
        }
      }
    } else {
      result[tesis.PaisCodi] = {
        count: 1,
        name: tesis.Pais,
        programs: [
          {
            name: tesis.Pla,
            count: tesis.Pla !== "" ? 1 : 0,
            researchLines: [
              {
                name: tesis.LiniaRecerca,
                count: tesis.LiniaRecerca !== "" ? 1 : 0,
                thesis: [
                  {
                    title: tesis.Titol,
                    date: tesis.DataLectura,
                    author: tesis.Doctorand,
                    director: tesis.PrimerDirector,
                  },
                ],
              },
            ],
          },
        ],
      };
      countryNames.push({
        label: tesis.Pais,
        value: tesis.PaisCodi,
      });
    }
  });

  // Sort data
  countryNames.sort((a, b) => a.label.localeCompare(b.label, "ca"));

  programes.sort((a, b) => {
    return a.name >= b.name ? 1 : -1;
  });

  programes.forEach((p, idx) => {
    programes[idx].researchLines = p.researchLines.sort();
  });

  // Sort thesis by date
  Object.keys(result).forEach((iso_a3) => {
    result[iso_a3].programs.forEach((program, idP) => {
      program.researchLines.forEach((researchLine, idL) => {
        result[iso_a3].programs[idP].researchLines[idL].thesis.sort((a, b) => {
          return a.date >= b.date ? 1 : -1;
        });
      });
    });
  });

  return { programes: programes, paisos: result, countryNames };
};

const formatPopup = (obj) => {
  function sortFunction(a, b) {
    if (a[1] === b[1]) {
      return 0;
    } else {
      return a[1] < b[1] ? 1 : -1;
    }
  }

  var html = "<table>";
  if (typeof obj === "string") {
    const base = JSON.parse(obj);
    // Sort table
    base.sort(sortFunction);
    base.forEach(function (programa) {
      html += `<tr><td>${programa[0]}</td><td>${programa[1]}</td></tr>`;
    });
  }
  html += "</table>";
  return html;
};

const getData = async (url) => {
  let data;
  await api
    .get(url)
    .then((resp) => {
      data = resp.data;
    })
    .catch((e) => {
      data = null;
    });
  return data;
};

function sortFeatures(a, b) {
  if (a.properties.tesis === b.properties.tesis) {
    return 0;
  } else {
    return a.properties.tesis < b.properties.tesis ? 1 : -1;
  }
}
const addThesisDataTo = (data, thesisData) => {
  data.features.forEach((element, idx) => {
    var code = element.properties.iso_a3;
    data.features[idx]["id"] = idx;

    if (code in thesisData) {
      data.features[idx].properties["tesis"] = thesisData[code].count;
      data.features[idx].properties["abstract"] = thesisData[code].abstract;
      data.features[idx].properties["pais"] = thesisData[code].name;
    } else {
      data.features[idx].properties["tesis"] = 0;
      data.features[idx].properties["abstract"] = null;
      data.features[idx].properties["pais"] = null;
    }
  });

  data.features.sort(sortFeatures);
  return data;
};

export {
  getRandomColor,
  getBbox,
  getCountryGeometry,
  organizeThesisData,
  getCountryAbstract,
  formatPopup,
  getData,
  addThesisDataTo,
};
