import { defineStore } from "pinia";

export const useAppStore = defineStore("counter", {
  state: () => ({
    // Initial map view mode
    clustered: false,

    programes: [],

    countryNames: [],
    
    selectedCountry: {},

    countryModalVisibility:  false,
  }),

  getters: {
    getProgrames: (state) => state.programes,

    isClustered: (state) => state.clustered,

    getSelectedCountry: (state) => state.selectedCountry,

    getCountryNames: (state) => state.countryNames,

    getCountryModalVisibility: (state) => state.countryModalVisibility,

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

    setSelectedCountry(country) {
      this.selectedCountry = country;
    },

    setCountryModalVisibility(visibility) {
      this.countryModalVisibility = visibility;
    },
  },
});
