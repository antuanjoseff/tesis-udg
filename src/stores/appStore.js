import { defineStore } from "pinia";

export const useAppStore = defineStore("counter", {
  state: () => ({
    clustered: true,

    programes: [],

    countryNames: [],
    
    selectedCountry: {}
  }),

  getters: {
    getProgrames: (state) => state.programes,

    isClustered: (state) => state.clustered,

    getSelectedCountry: (state) => state.selectedCountry,

    getCountryNames: (state) => state.countryNames,
  },

  actions: {
    setProgrames(programes) {
      this.programes = programes;
    },

    setClustered(value) {
      this.clustered = value;
    },

    setCountryNames(countries) {
      console.log(countries)
      this.countryNames = countries;
    },

    setSelectedCountry(country) {
      this.selectedCountry = country;
    },
  },
});
