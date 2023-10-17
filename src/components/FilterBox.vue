<template>
  <div v-if="filterIsVisible" class="q-px-md filter-box">
    <div class="filter-label q-py-md">Selecciona:</div>
    <div class="filter-program q-gutter-md row">
      <q-select
        label="Programes"
        option-value="name"
        option-label="name"
        :model-value="modelProgram"
        use-input
        hide-selected
        fill-input
        filled
        input-debounce="0"
        :options="programOptions"
        style="width: 250px; padding-bottom: 32px"
        color="orange"
        bg-color="grey"
        clearable
        popup-content-class="qselect-options"
        @filter="filterProgramFn"
        @input-value="setModelProgram"
        @clear="resetProgram"
      >
      </q-select>
    </div>
    <div class="filter-linia-recerca">
      <q-select
        label="Línies de recerca"
        :model-value="modelLine"
        use-input
        hide-selected
        fill-input
        filled
        input-debounce="0"
        :options="researchLineOptions"
        style="width: 250px; padding-bottom: 32px"
        color="orange"
        bg-color="grey"
        clearable
        :disable="!modelProgram"
        popup-content-class="qselect-options"
        @filter="filterResearchLineFn"
        @input-value="setModelLine"
        @clear="resetLine"
      >
      </q-select>
    </div>
  </div>
</template>

<script>
import { useAppStore } from "../stores/appStore.js";
import { computed, ref } from "vue";

export default {
  name: "FilterBox",
  emits: ["filterSet", "filterReset"],
  setup(props, context) {
    const appStore = useAppStore();
    const modelProgram = ref("");
    const modelLine = ref("");
    const filledStyle = ref(false);

    const stringProgramOptions = computed(() => {
      return appStore.getProgrames;
    });

    const stringResearchLineOptions = computed(() => {
      return appStore.getResearchLines;
    });

    const filterIsVisible = computed(() => {
      return appStore.getFilterIsVisible;
    });

    const programOptions = ref(JSON.stringify(stringProgramOptions.value));
    const researchLineOptions = computed(() => {
      return appStore.getResearchLines;
    });

    const setModelProgram = (val) => {
      if (val.length) {
        context.emit("filterSet", { program: val, researchLine: "" });
        appStore.setFilteredProgram(val);
      }
      modelProgram.value = val;
      modelLine.value = "";
    };

    const resetProgram = () => {
      modelProgram.value = "";
      appStore.setFilteredProgram("");
      context.emit("filterReset", {
        program: "",
        researchLine: "",
      });
    };

    const setModelLine = (val) => {
      if (val.length) {
        context.emit("filterSet", {
          program: modelProgram.value,
          researchLine: val,
        });
        appStore.setFilteredLine(val);
      }
      modelLine.value = val;
    };

    const resetLine = () => {
      modelLine.value = "";
      context.emit("filterReset", {
        program: modelProgram.value,
        researchLine: "",
      });
      appStore.setFilteredLine("");
    };

    const filterProgramFn = (val, update, abort) => {
      update(() => {
        const needle = val.toLocaleLowerCase();
        programOptions.value = stringProgramOptions.value.filter(
          (v) => v.name.toLocaleLowerCase().indexOf(needle) > -1
        );
      });
    };

    const filterResearchLineFn = (val, update, abort) => {
      update(() => {
        const needle = val.toLocaleLowerCase();
        researchLineOptions.value = stringResearchLineOptions.value.filter(
          (v) => v.toLocaleLowerCase().indexOf(needle) > -1
        );
      });
    };

    const showSelectStyle = () => {
      filledStyle.value = true;
    };

    const hideSelectStyle = () => {
      filledStyle.value = false;
    };

    return {
      filterIsVisible,
      filledStyle,
      modelProgram,
      modelLine,
      filterProgramFn,
      filterResearchLineFn,
      setModelProgram,
      setModelLine,
      programOptions,
      researchLineOptions,
      showSelectStyle,
      hideSelectStyle,
      resetProgram,
      resetLine,
    };
  },
};
</script>

<style>
.filter-box {
  width: 450px;
  position: absolute;
  top: 10px;
  left: 60px;
  background-color: black;
}

.filter-box .filter-label {
  color: white;
  text-align: left;
  font-size: 24px;
}

.filter-box .q-field__labe) {
  color: white !important;
}
.filter-box label.q-field.row {
  width: 100% !important;
}

.qselect-options {
  background: black !important;
  color: white;
  width: 400px;
}

.filter-program .q-field__label,
.filter-program input,
.filter-linia-recerca .q-field__label,
.filter-linia-recerca input {
  color: white;
}

.filter-program .q-field--filled .q-field__control,
.filter-linia-recerca .q-field--filled .q-field__control {
  border-radius: 0;
}
</style>
