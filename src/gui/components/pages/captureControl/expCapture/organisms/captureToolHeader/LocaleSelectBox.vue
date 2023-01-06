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

    <v-dialog v-model="languageDialogBoxOpened" max-width="490" persistent>
      <v-card>
        <v-card-title class="headline">
          Choose the language / 言語を選択
        </v-card-title>
        <v-card-text>
          <v-radio-group v-model="language" mandatory row>
            <v-radio label="English" value="en" color="red"></v-radio>
            <v-radio label="日本" value="ja" color="red"></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-btn
            @click="changeLocale(language)"
            color="red"
            class="white--text"
          >
            Apply / 申し込み
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

@Component({
  components: {
    "error-message-dialog": ErrorMessageDialog,
  },
})
export default class LocaleSelectBox extends Vue {
  private locales: string[] = ["ja", "en"];
  private errorMessageDialogOpened = false;
  private errorMessage = "";
  private language = "";
  private languageDialogBoxOpened = false;

  private created(): void {
    if (localStorage.getItem("appOpenedBefore") === null) {
      this.languageDialogBoxOpened = true;
      localStorage.setItem("appOpenedBefore", "true");
    }
  }

  public get initLocale(): string {
    return this.$store.getters.getLocale();
  }

  private changeLocale(locale: string): void {
    (async () => {
      try {
        await this.$store.dispatch("changeLocale", { locale });
        this.languageDialogBoxOpened = false;
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
