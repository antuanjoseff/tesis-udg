<template>
  <div class="q-pa-md search-country">
    <div class="q-gutter-md row">
      <q-select
        :model-value="model"
        option-value="value"
        option-label="label"
        use-input
        hide-selected
        fill-input
        rounded
        outlined
        input-debounce="0"
        :options="options"
        @filter="filterFn"
        @input-value="setModel"
        style="width: 250px; padding-bottom: 32px"
        bg-color="white"
      >
        <template v-slot:append>
          <q-icon
            v-if="model !== ''"
            name="close"
            @click.stop.prevent="model = ''"
            class="cursor-pointer"
          />
          <q-icon name="search" @click.stop.prevent />
        </template>

        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
  </div>
</template>

<script>
import { useAppStore } from "../stores/appStore.js";
import { computed, ref } from "vue";

export default {
  name: "SearchCountry",
  emits: ["countrySelected"],
  setup(props, context) {
    const appStore = useAppStore();
    const model = ref("");

    const stringOptions = computed(() => {
      return appStore.getCountryNames;
    });
    const options = ref(JSON.stringify(stringOptions.value));

    const countrySelected = (e) => {
      context.emit("countrySelected");
      appStore.setSelectedCountry(model.value);
    };

    const getCountryCodeFromName = (name) => {
      let idx = -1;
      let countries = JSON.parse(JSON.stringify(stringOptions.value));

      idx = countries.findIndex((c) => {
        return c.label.toLocaleLowerCase() === name.toLocaleLowerCase();
      });
      if (idx != -1) {
        return stringOptions.value[idx].value;
      } else {
        return "";
      }
    };

    const setModel = (val) => {
      if (val.length) {
        let selected = getCountryCodeFromName(val);
        appStore.setSelectedCountry(selected);
        context.emit("countrySelected", selected.toLocaleLowerCase());
      }
      model.value = val;
    };

    const filterFn = (val, update, abort) => {
      update(() => {
        const needle = val.toLocaleLowerCase();
        options.value = stringOptions.value.filter(
          (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
        );
      });
    };

    return {
      model,
      filterFn,
      countrySelected,
      setModel,
      options,
    };
  },
};
</script>

<style scoped>
.search-country {
  position: absolute;
  top: 20px;
  right: 20px;
}
</style>
