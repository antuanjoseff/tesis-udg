<template>
  <q-dialog v-model="model" full-width full-height>
    <q-card class="dialog-container">
      <q-card-section class="row items-center q-pb-none">
        <q-space />
        <q-btn
          icon="close"
          flat
          round
          dense
          @click="close"
          size="lg"
          class="custom"
        />
      </q-card-section>

      <q-card-section>
        <div class="text-center country-name">
          <!-- {{ selectedCountry.info.name.toUpperCase() }} -->
        </div>
        <q-separator class="separator" />
      </q-card-section>

      <q-card-section>
        <div class="text-center thesis-count">
          <!-- {{ selectedCountry.nTesis }} -->
        </div>
        <div class="text-center thesis">Tesis</div>
        <q-separator class="separator" />
      </q-card-section>

      <q-card-section>
        <div class="programa-doctorat">Programa de doctorat</div>
      </q-card-section>

      <q-card-section>
        <LRChart :data="selectedCountry.info" :program="selectedProgram" />
      </q-card-section>

      <q-card-section>
        <q-separator class="separator" />
      </q-card-section>

      <q-card-section>
        <div class="tesis-llegides-container">
          <div class="tesis-llegides">Tesis llegides</div>
          <div>
            <q-btn
              :icon="isVisible ? 'remove' : 'add'"
              flat
              round
              dense
              @click="toggleThesis"
              size="lg"
              class="custom-white"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-section v-if="isVisible">
        <div class="q-pa-lg flex flex-center">
          <q-pagination
            v-if="maxPages > 1"
            v-model="page"
            :max="maxPages"
            :max-pages="10"
            :boundary-numbers="false"
            @update:model-value="showPage"
          />
        </div>
        <ul class="tesis-list">
          <li v-for="(item, index) in visibleList" :key="index">
            <div>
              <div :id="index" @click="toggleDetail(item, index)">
                {{ item.date }} - {{ item.title }}
              </div>
              <div
                v-if="visibleDetails.includes(index)"
                class="details-container flex column"
              >
                <div class="flex row border-bottom q-py-md">
                  <div>Autor:</div>
                  <div>{{ item.author }}</div>
                </div>
                <div class="flex row border-bottom q-py-md">
                  <div>Director:</div>
                  <div>{{ item.director }}</div>
                </div>
                <div class="flex row border-bottom q-py-md">
                  <div>Lectura:</div>
                  <div>{{ item.date }}</div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </q-card-section>
      <q-card-section>
        <q-btn
          color="black"
          label="Cercador de tesis"
          class="absolute-center q-mt-lg"
          @click="goUdG"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useAppStore } from "src/stores/appStore.js";
import LRChart from "src/components/LRChart.vue";
import { computed, ref, onUpdated } from "vue";

export default {
  name: "LRModal",
  components: { LRChart },
  emits: ["countrySelected"],
  setup(props, context) {
    const list = ref([]);
    const visibleList = ref([]);
    const isVisible = ref(false);
    const page = ref(1);
    const maxPages = ref();
    const visibleDetails = ref([]); // Array of visible details
    const appStore = useAppStore();

    const thesisPerPage = appStore.getThesisPerPage;

    const model = computed(() => {
      return appStore.getSelectedProgram != "";
    });

    const close = () => {
      appStore.setSelectedProgram("");
    };

    const selectedProgram = computed(() => {
      return appStore.getSelectedProgram;
    });

    const selectedCountry = computed(() => {
      return appStore.getSelectedCountry;
    });

    const maxValue = computed(() => {
      var max = 0;
      appStore.getSelectedCountry.info.programs.forEach((p) => {
        if (p.count > max) {
          max = p.count;
        }
      });
      return max;
    });

    const selectedCountryName = computed(() => {
      const countryNames = appStore.countryNames;
      var found = countryNames.find((country) => {
        return country.value === selectedCountry.value.code;
      });
      return found ? found.label : "";
    });

    const toggleDetail = (tesis, index) => {
      const idx = visibleDetails.value.findIndex((ele) => {
        return ele === index;
      });
      if (idx !== -1) {
        visibleDetails.value.splice(idx);
      } else {
        visibleDetails.value.push(index);
      }
    };

    const toggleThesis = () => {
      isVisible.value = !isVisible.value;
      if (!list.value.length) {
        selectedCountry.value.info.programs.forEach((p) => {
          maxPages.value = Math.ceil(
            selectedCountry.value.nTesis / thesisPerPage
          );

          p.LR.forEach((lr) => {
            lr.thesis.forEach((t) => {
              list.value.push({
                title: t.title,
                date: t.date,
                author: t.author,
                director: t.director,
              });
            });
          });
        });
        list.value.sort((a, b) => (a.date <= b.date ? 1 : -1));
      }

      var first = (page.value - 1) * thesisPerPage;
      var last = page.value * thesisPerPage;
      visibleList.value = list.value.slice(first, last);
    };

    const showPage = (idx) => {
      var first = (idx - 1) * thesisPerPage;
      var last = idx * thesisPerPage;
      visibleList.value = list.value.slice(first, last);
    };

    onUpdated(() => {
      list.value = [];
      visibleList.value = [];
      page.value = 1;
      isVisible.value = false;
    });

    const goUdG = () => {
      document.location = "https://www.udg.edu";
    };

    return {
      isVisible,
      list,
      visibleList,
      visibleDetails,
      model,
      selectedProgram,
      close,
      selectedCountry,
      selectedCountryName,
      toggleThesis,
      toggleDetail,
      maxValue,
      maxPages,
      page,
      showPage,
      goUdG,
    };
  },
};
</script>

<style scoped>
.dialog-container {
  padding: 40px;
}
button.custom {
  background-color: #11172b;
  color: white;
}

button.custom-white {
  background-color: white;
  color: #11172b;
  border-radius: 50%;
  border: 1px solid #11172b;
}

button.custom-white:hover,
button.custom:hover {
  background-color: #11172b88;
  color: white;
}

.country-name,
.tesis-llegides,
.thesis {
  font-size: 30px;
  color: #11172b;
}

.thesis-count {
  font-size: 70px;
}

.programa-doctorat {
  font-size: 50px;
  font-family: "Roboto";
  font-weight: 500;
}
.separator {
  background: #11172b;
}
.tesis-llegides-container {
  display: flex;
  justify-content: space-between;
  border: 1px solid #11172b;
  padding: 20px;
}
.details-container {
  border: 1px solid #00000029;
  padding: 20px;
  justify-content: space-between;
}

.details-container div {
  min-width: 100px;
}
.border-bottom {
  border-bottom: 1px solid #00000029;
}
.border-bottom div:first-child {
  font-weight: 600;
}

ul.tesis-list li {
  padding: 5px 0px;
}
ul.tesis-list li:hover {
  text-decoration: underline;
  cursor: pointer;
}
.full-width div {
  min-width: 100%;
}
</style>
