<template>
  <q-dialog
    v-model="modalVisibility"
    class="program-container"
    full-width
    position="left"
  >
    <q-card class="dialog-container">
      <q-card-section
        class="row items-center close-card"
        :class="filteredProgram != '' ? 'filtered' : ''"
      >
        <div v-if="filteredProgram" class="filter-msg">
          <q-icon name="error_outline" size="lg" />
          Hi ha un filtre aplicat
        </div>
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
        <div class="text-left flex chart-breadcrumb">
          <div>
            <q-icon
              v-if="programClickedOnChart"
              name="arrow_back"
              size="xl"
              class="q-mr-md arrow-back"
              @click="goBack"
            />
          </div>
          <div class="chart-title">
            <span class="text-weight-medium">
              Programa de doctorat: {{ programName }}
            </span>
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="text-center country-name">
          {{ selectedCountry.info.name.toUpperCase() }}
        </div>
        <q-separator class="separator" />
      </q-card-section>

      <q-card-section>
        <div class="text-center thesis-count">
          {{ nThesisInLR }}
        </div>
        <div class="text-center thesis">Tesis</div>
        <q-separator class="separator" />
      </q-card-section>

      <q-card-section>
        <div class="programa-doctorat">Línia de recerca</div>
      </q-card-section>

      <q-card-section>
        <div class="text-center" v-if="!filteredLine">
          <LRChart
            :data="selectedCountry.info"
            :title="
              programClickedOnChart ? programClickedOnChart : filteredProgram
            "
            :subtitle="filteredLine"
          />
        </div>
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
        <ul class="tesis-list">
          <li v-for="(item, index) in visibleList" :key="index">
            <div>
              <div
                :id="index"
                @click="toggleDetail(item, index)"
                class="thesis-header"
              >
                {{ new Date(item.date).getFullYear() }} - {{ item.title }}
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
                  <div>{{ item.formattedDate }}</div>
                </div>
              </div>
            </div>
          </li>
        </ul>
        <!-- PAGINATION -->
        <div class="q-pa-lg flex flex-center">
          <q-pagination
            v-if="maxPages > 1"
            v-model="page"
            :max="maxPages"
            :max-pages="10"
            color="orange"
            :boundary-numbers="false"
            @update:model-value="showPage"
          />
        </div>
      </q-card-section>
      <q-card-section>
        <q-btn color="black" class="absolute-center q-mt-lg" type="a">
          <a href="https://www.udg.edu" class="thesis-searcher" target="_blank"
            >CERCADOR DE TESIS</a
          >
        </q-btn>
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

    const modalVisibility = computed(() => {
      return appStore.getLRModalVisibility;
    });

    const nThesisInLR = computed(() => {
      return appStore.getNThesisInLR;
    });

    const close = () => {
      appStore.setProgramClickedOnChart("");
      appStore.setProgramModalVisibility("false");
      appStore.setLRModalVisibility("false");
    };

    const goBack = () => {
      appStore.setProgramClickedOnChart("");
      appStore.setLRModalVisibility("false");
    };

    const filteredProgram = computed(() => {
      return appStore.getFilteredProgram;
    });

    const programClickedOnChart = computed(() => {
      return appStore.getProgramClickedOnChart;
    });

    const programName = computed(() => {
      return filteredProgram.value !== ""
        ? filteredProgram.value
        : programClickedOnChart.value;
    });

    const filteredLine = computed(() => {
      return appStore.getFilteredLine;
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

    const formatDate = (strDate) => {
      if (typeof strDate === "string") {
        const [y, m, d] = strDate.split("-");
        const date = new Date(y, m - 1, d);
        const year = date.getFullYear();
        // const month = String(date.getMonth() + 1).padStart(2, "0");
        const month = date.toLocaleString("default", { month: "short" });
        const day = String(date.getDate()).padStart(2, "0");
        return `${day}-${month}-${year}`;
      } else {
        return "";
      }
    };

    const toggleThesis = () => {
      isVisible.value = !isVisible.value;
      if (!list.value.length) {
        const data = JSON.parse(
          JSON.stringify(selectedCountry.value.info.programs)
        );

        const element = data.filter((p) => {
          return p.name == programName.value;
        });

        element[0].researchLines.forEach((lr) => {
          if (filteredLine.value === "") {
            lr.thesis.forEach((t) => {
              addThesisToList(t);
            });
          } else {
            if (filteredLine.value === lr.name) {
              lr.thesis.forEach((t) => {
                addThesisToList(t);
              });
            }
          }
        });

        maxPages.value = Math.ceil(list.value.length / thesisPerPage);

        list.value.sort((a, b) => (a.date <= b.date ? 1 : -1));
      }

      var first = (page.value - 1) * thesisPerPage;
      var last = page.value * thesisPerPage;
      visibleList.value = list.value.slice(first, last);
    };

    const addThesisToList = (t) => {
      list.value.push({
        title: t.title,
        date: t.date,
        formattedDate: formatDate(t.date),
        author: t.author,
        director: t.director,
      });
    };

    const showPage = (idx) => {
      var first = (idx - 1) * thesisPerPage;
      visibleDetails.value = [];
      var last = idx * thesisPerPage;
      visibleList.value = list.value.slice(first, last);
    };

    onUpdated(() => {
      list.value = [];
      visibleList.value = [];
      page.value = 1;
      isVisible.value = false;
    });

    return {
      nThesisInLR,
      isVisible,
      list,
      visibleList,
      visibleDetails,
      modalVisibility,
      filteredProgram,
      filteredLine,
      programName,
      programClickedOnChart,
      close,
      selectedCountry,
      selectedCountryName,
      toggleThesis,
      toggleDetail,
      maxValue,
      maxPages,
      page,
      showPage,
      goBack,
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
  cursor: default;
  text-transform: unset;
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
ul.tesis-list .thesis-header:hover {
  text-decoration: underline;
  cursor: pointer;
}
.full-width div {
  min-width: 100%;
}
.close-card.filtered {
  background: black;
  color: white;
}
.filter-msg {
  text-align: left;
  font-size: 25px;
}
.thesis-searcher {
  color: white;
  text-decoration: none;
}

.arrow-back {
  cursor: pointer;
}
@media (min-width: 600px) {
  .q-dialog__inner--minimized > div {
    min-width: "50%";
  }
}
</style>
