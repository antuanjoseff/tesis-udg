import Bounds from "./Bounds.js";
import {
  clusters as clustersProperties,
  countries as countriesProperties,
  uncluster as unclusteredProperties,
} from "src/lib/paintProperties.js";

import { getBbox, getCountryGeometry } from "src/lib/utils.js";

function addLayersToMap(map, isClustered) {
  // COUNTRIES
  map.value.addLayer({
    id: "countries",
    type: "fill",
    source: "countries",
    layout: {
      visibility: isClustered.value ? "none" : "visible",
    },
    filter: [">", ["get", "tesis"], 0],
    paint: countriesProperties,
  });

  // UNCLUSTERED
  map.value.addLayer({
    id: "unclustered",
    type: "symbol",
    source: "clusters",
    layout: {
      "text-field": ["get", "tesis"],
      "text-font": ["FiraSans-Bold"],
      "text-size": 14,
      "icon-image": "marker",
      "icon-size": 0.7,
      "icon-allow-overlap": true,
      visibility: "none",
    },
    filter: ["all", [">", ["get", "tesis"], 0], ["!", ["has", "point_count"]]],
    paint: {
      "icon-translate": [0, 5],
      "text-color": "#fff",
    },
    // paint: unclusteredProperties,
  });

  // CLUSTERED
  map.value.addLayer({
    id: "clusters",
    type: "circle",
    source: "clusters",
    filter: ["all", [">", ["get", "sum"], 0], ["has", "point_count"]],
    layout: {
      visibility: "none",
    },
    paint: clustersProperties,
  });

  map.value.addLayer({
    id: "clustered-count",
    type: "symbol",
    source: "clusters",
    filter: ["all", [">", ["get", "sum"], 0], ["has", "point_count"]],
    layout: {
      // 'text-field': '{point_count_abbreviated}',
      "text-field": ["get", "sum"],
      "text-font": ["FiraSans-Bold"],
      "text-size": 14,
      visibility: "none",
    },
    paint: {
      "text-color": "#fff",
    },
  });

  // BODERS
  map.value.addLayer({
    id: "boundaries",
    type: "line",
    source: "countries",
    layout: {},
    // properties
    paint: {
      // "line-color": "rgba(129, 66, 84, 1)",
      "line-color": "rgba(255, 255, 255, 1)",
      "line-width": [
        "case",
        ["==", ["to-number", ["get", "tesis"]], 0],
        0,
        ["boolean", ["feature-state", "hover"], false],
        2,
        0,
      ],
    },
  });
}

const flyToCountry = (map, countriesData, code, ...hoverStyle) => {
  let bounds = new Bounds([]);
  code.forEach((c) => {
    const countryGeom = getCountryGeometry(countriesData, c.toUpperCase());
    bounds.expand(getBbox(countryGeom));
  });

  map.value.fitBounds(bounds.getBounds(), {
    padding: 20,
  });

  // Check if selected style is required
  if (code.length === 1 && hoverStyle) {
    let country = undefined;
    countriesData.features.forEach((element) => {
      map.value.setFeatureState(
        { source: "countries", id: element.id },
        { hover: false }
      );
      if (element.properties.iso_a3.toLowerCase() === code[0].toLowerCase()) {
        country = element;
      }
    });

    if (country) {
      map.value.setFeatureState(
        { source: "countries", id: country.id },
        { hover: true }
      );
    }
  }
};

export { addLayersToMap, flyToCountry };
