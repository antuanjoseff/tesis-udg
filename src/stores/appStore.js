import { defineStore } from "pinia";

export const useAppStore = defineStore("counter", {
  state: () => ({
    // Initial map view mode
    clustered: false,

    programes: [],

    researchLines: [],

    countryNames: [],

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
    getProgrames: (state) => state.programes,

    getResearchLines: (state) => state.researchLines,

    isClustered: (state) => state.clustered,

    getSelectedCountry: (state) => state.selectedCountry,

    getProgramClickedOnChart: (state) => state.programClickedOnChart,

    getFilteredProgram: (state) => state.filteredProgram,

    getFilteredLine: (state) => state.filteredLine,

    getCountryNames: (state) => state.countryNames,

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

    setCountryNames(countries) {
      this.countryNames = countries;
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
      this.programModalVisibility = false;
      this.LRModalVisibility = visibility;
    },

    toggleFilter(visibility) {
      this.filterIsVisible = !this.filterIsVisible;
    },
  },
});
