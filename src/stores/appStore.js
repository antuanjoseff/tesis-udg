import { defineStore } from 'pinia';

export const useAppStore = defineStore('counter', {
  state: () => ({
    programes: [],
  }),
  getters: {
    getProgrames: (state) => state.programes,
  },
  actions: {
    setProgrames(programes) {
      this.programes = programes
    },
  },
});
