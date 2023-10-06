<template>

  <q-dialog 
    v-model="model"
    full-width
    full-height>
    <q-card class="dialog-container">
      <q-card-section class="row items-center q-pb-none">
        <q-space />
        <q-btn 
          icon="close"
          flat round dense @click="close" 
          size="lg"
          class="custom"
        />
      </q-card-section>

      <q-card-section>
        <div class="text-center country-name">
          {{selelectedCountryName.toUpperCase()}}
        </div>
        <q-separator class="separator"/>
      </q-card-section>

      <q-card-section>
        <div class="text-center thesis-count">
          {{selectedCountry.nTesis}}
        </div>
        <div class="text-center thesis">Tesis</div>
        <q-separator class="separator"/>
      </q-card-section>

      <q-card-section>
        <div class="programa-doctorat">Programa de doctorat</div>
      </q-card-section>

      <q-card-section>
        <BarChart :data="selectedCountry.abstract" :num="maxValue"/>
      </q-card-section>

      <q-card-section>
        <q-separator class="separator"/>
      </q-card-section>

      <q-card-section>
        <div class="tesis-llegides-container">
          <div class="tesis-llegides">
            Tesis llegides
          </div>
          <div>
            <q-btn 
              icon="add"
              flat round dense @click="showThesis" 
              size="lg"
              class="custom-white"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
  
  
</template>

<script>

import { useAppStore } from "src/stores/appStore.js";
import BarChart from "src/components/BarChart.vue";
import { computed, ref } from "vue";

export default {
  name: "SearchCountry",
  components: { BarChart },
  emits: ["countrySelected"],
  setup(props, context) {
    const appStore = useAppStore();
    
    const model = computed(() => {
      return appStore.getCountryModalVisibility
    });        
    
    const close = () => {
      appStore.setCountryModalVisibility(false)
    }
      
    const selectedCountry = computed(() => {
      return appStore.getSelectedCountry
    })

    const maxValue = computed(() => {
      var max = 0
      appStore.getSelectedCountry.abstract.forEach((p) => {
        if (p[1] > max) {
          max = p[1]
        }
      })
      return max
    })


    
    const selelectedCountryName = computed(() => {
      const countryNames = appStore.countryNames
      var found =countryNames.find((country) => {
        return country.value === selectedCountry.value.code
      })
      return found ? found.label : ''
    })
    
    const showThesis = () => {
      console.log(selectedCountry.value.code)
    }

    return {
      model,
      close,
      selectedCountry,
      selelectedCountryName,
      showThesis
    }
  },
}
</script>

<style scoped>
.dialog-container{
  padding: 40px;
}
button.custom{
  background-color: #11172B;
  color: white;
} 

button.custom-white{
  background-color: white;
  color: #11172B;
  border-radius: 50%;
  border: 1px solid #11172B;  
} 

button.custom-white:hover,
button.custom:hover{
  background-color: #11172B88;
  color: white;
} 

.country-name,
.tesis-llegides,
.thesis{
  font-size: 30px;
  color: #11172B;
}

.thesis-count{
  font-size: 70px;
}

.programa-doctorat{
  font-size: 50px;
  font-family: 'Roboto';
  font-weight: 500;
}
.separator{
  background: #11172B;
}
.tesis-llegides-container{
  display: flex;
  justify-content: space-between;
  border: 1px solid  #11172B;
  padding: 20px;
}

</style>