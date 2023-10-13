import { defineStore } from "pinia";

export const useAppStore = defineStore("counter", {
  state: () => ({
    // Initial map view mode
    clustered: false,

    programes: [],

    researchLines: [],

    countryNames: [],

    selectedCountry: {},

    selectedProgram: "", // Program selected from chart

    filteredProgram: "", 

    filteredLine: "", 

    nThesisInLR: 0,

    countryModalVisibility: false,

    thesisPerPage: 30,

    LRnoName: 'Sense determinar',

    filterIsVisible: false,
  }),

  getters: {
    getProgrames: (state) => state.programes,

    getResearchLines: (state) => state.researchLines,

    isClustered: (state) => state.clustered,

    getSelectedCountry: (state) => state.selectedCountry,

    getSelectedProgram: (state) => state.selectedProgram,

    getFilteredProgram: (state) => state.filteredProgram,

    getFilteredLine: (state) => state.filteredLine,

    getCountryNames: (state) => state.countryNames,

    getCountryModalVisibility: (state) => state.countryModalVisibility,

    getThesisPerPage: (state) => state.thesisPerPage,

    getNThesisInLR: (state) => state.nThesisInLR,

    getLRnoName: (state) => state.LRnoName,

    getFilterIsVisible: (state) => state.filterIsVisible
  },

  actions: {
    setProgrames(programes) {
      this.programes = programes;
    },

    setResearchLines(researchLines) {
      this.researchLines = researchLines;
    },

    setClustered(value) {
      this.clustered = value;
    },

    setCountryNames(countries) {
      this.countryNames = countries;
    },

    setSelectedProgram(program) {
      this.selectedProgram = program;
    },

    setFilteredProgram(program) {
      this.filteredProgram = program;
    },

    setFilteredLine(researchLine) {
      this.filteredLine = researchLine;
    },

    setNThesisInLR(value) {
      this.nThesisInLR = value;
    },

    setSelectedCountry(data) {
      this.selectedCountry = data;
    },

    setCountryModalVisibility(visibility) {
      this.countryModalVisibility = visibility;
    },

    toggleFilter(visibility) {
      this.filterIsVisible = !this.filterIsVisible;
    },
  },
});
