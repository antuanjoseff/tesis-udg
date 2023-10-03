import { defineStore } from "pinia";

export const useAppStore = defineStore("counter", {
  state: () => ({
    clustered: true,
    programes: [],
  }),
  getters: {
    getProgrames: (state) => state.programes,
    isClustered: (state) => state.clustered,
  },
  actions: {
    setProgrames(programes) {
      this.programes = programes;
    },
    setClustered(value) {
      this.clustered = value;
    },
  },
});
