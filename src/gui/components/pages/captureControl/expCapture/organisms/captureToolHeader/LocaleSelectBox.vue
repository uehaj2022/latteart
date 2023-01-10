<!--
 Copyright 2022 NTT Corporation.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
-->

<template>
  <div>
    <v-select
      :label="$store.getters.message('manage-header.locale')"
      :items="locales"
      :value="initLocale"
      v-on:change="changeLocale"
    ></v-select>
    <div>
    <v-dialog v-model="showDialog" max-width="500">
      <template v-slot:activator="{ on }">
        <v-btn color="primary" v-on="on">Translate</v-btn>
      </template>
      <v-card>
        <v-card-title>
          <span>Select a language to translate to:</span>
        </v-card-title>
        <v-card-text>
          <v-select :items="languages" v-model="selectedLanguage" label="Select"></v-select>
         
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="translatePage">Translate</v-btn>
          <v-btn color="secondary" @click="showDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
   
  </div>

    <error-message-dialog
      :opened="errorMessageDialogOpened"
      :message="errorMessage"
      @close="errorMessageDialogOpened = false"
    />
  </div>
</template>

<script lang="ts">
import ErrorMessageDialog from "@/components/pages/common/ErrorMessageDialog.vue";
import { Component, Vue } from "vue-property-decorator";
import { reactive, ref } from 'vue'

@Component({
  components: {
    "error-message-dialog": ErrorMessageDialog,
  },
})
export default class LocaleSelectBox extends Vue {
  private locales: string[] = ["ja", "en"];
  private showDialog = false;
  private languages = ["English", "Japanese"];
  private selectedLanguage = ref(null);
  private errorMessageDialogOpened = false;
  private errorMessage = "";

  public get initLocale(): string {
    return this.$store.getters.getLocale();
  }
  onMounted(() => {
      elements.value = Array.from(this.$refs.elements);
    });
  private translatePage = () => {
      let translator = new Intl.Translator();
      translator.translate(textToTranslate.value, {to: this.selectedLanguage.value.toLowerCase()}).then(translation => {
        translatedText.value = translation;
      });
    }

  private changeLocale(locale: string): void {
    (async () => {
      try {
        await this.$store.dispatch("changeLocale", { locale });
        this.showDialog = false;
      } catch (error) {
        if (error instanceof Error) {
          this.errorMessage = error.message;
          this.errorMessageDialogOpened = true;
        } else {
          throw error;
        }
      }
    })();
  }
}
</script>
