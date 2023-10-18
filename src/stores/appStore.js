import { defineStore } from "pinia";

export const useAppStore = defineStore("counter", {
  state: () => ({
    // Initial map view mode
    initialMapView: { lng: 2.813179, lat: 41.98211, zoom: 2 },

    clustered: false,

    programes: [],

    researchLines: [],

    allCountryNames: [],

    filteredCountryNames: [],

    selectedCountry: {},

    programClickedOnChart: "", // Program selected from chart

    filteredProgram: "",

    filteredLine: "",

    nThesisInLR: 0,

    programModalVisibility: false,

    LRModalVisibility: false,

    thesisPerPage: 30,

    LRnoName: "Sense determinar",

    filterIsVisible: false,
  }),

  getters: {
    getInitialMapView: (state) => state.initialMapView,

    getProgrames: (state) => state.programes,

    getResearchLines: (state) => state.researchLines,

    isClustered: (state) => state.clustered,

    getSelectedCountry: (state) => state.selectedCountry,

    getProgramClickedOnChart: (state) => state.programClickedOnChart,

    getFilteredProgram: (state) => state.filteredProgram,

    getFilteredLine: (state) => state.filteredLine,

    getAllCountryNames: (state) => state.allCountryNames,

    getFilteredCountryNames: (state) => state.filteredCountryNames,

    getProgramModalVisibility: (state) => state.programModalVisibility,

    getLRModalVisibility: (state) => state.LRModalVisibility,

    getThesisPerPage: (state) => state.thesisPerPage,

    getNThesisInLR: (state) => state.nThesisInLR,

    getLRnoName: (state) => state.LRnoName,

    getFilterIsVisible: (state) => state.filterIsVisible,
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

    setAllCountryNames(countries) {
      this.allCountryNames = countries;
    },

    setFilteredCountryNames(countries) {
      this.filteredCountryNames = countries;
    },

    setProgramClickedOnChart(program) {
      this.programClickedOnChart = program;
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

    setProgramModalVisibility(visibility) {
      this.LRModalVisibility = false;
      this.programModalVisibility = visibility;
    },

    setLRModalVisibility(visibility) {
      this.LRModalVisibility = visibility;
    },

    toggleFilter(visibility) {
      this.filterIsVisible = !this.filterIsVisible;
    },
  },
});
