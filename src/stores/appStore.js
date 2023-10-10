import { defineStore } from "pinia";

export const useAppStore = defineStore("counter", {
  state: () => ({
    // Initial map view mode
    clustered: false,

    programes: [],

    countryNames: [],

    selectedCountry: {},

    selectedLR: [],

    countryModalVisibility: false,

    thesisPerPage: 6,
  }),

  getters: {
    getProgrames: (state) => state.programes,

    isClustered: (state) => state.clustered,

    getSelectedCountry: (state) => state.selectedCountry,

    getSelectedCountryLR: (state) => state.selectedLR,

    getCountryNames: (state) => state.countryNames,

    getCountryModalVisibility: (state) => state.countryModalVisibility,

    getThesisPerPage: (state) => state.thesisPerPage,
  },

  actions: {
    setProgrames(programes) {
      this.programes = programes;
    },

    setClustered(value) {
      this.clustered = value;
    },

    setCountryNames(countries) {
      this.countryNames = countries;
    },

    setSelectedLR(LR) {
      this.selectedLR = LR;
    },

    setSelectedCountry(data) {
      this.selectedCountry = data;
    },

    setCountryModalVisibility(visibility) {
      this.countryModalVisibility = visibility;
    },
  },
});
