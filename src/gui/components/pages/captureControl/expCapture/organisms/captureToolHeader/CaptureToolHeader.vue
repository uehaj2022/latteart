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
  <v-layout
  justify-space-between
  align-space-between
  row
  @keydown="cancelKeydown"
>
  <div>
    <v-layout>
      <url-text-field />
      <test-result-name-text-field />
      <v-btn
        color="primary"
        @click="submitForm"
      >
        Submit
      </v-btn>
    </v-layout>
  </div>
</v-layout>
  <v-layout justify-start align-center row @keydown="cancelKeydown">
    <url-text-field />
    <test-result-name-text-field />

    <div>
      <v-layout>
        <record-button />
        <pause-button />
        <clear-history-button />

        <load-history-button />
        <menu-button />
      </v-layout>
    </div>
    <div>
  <v-layout>
    <load-history-button />
    <menu-button />
    <v-spacer />
    <v-icon @click="openSettings">settings</v-icon>
  </v-layout>
</div>
<v-menu
  top
  offset-y
  origin="center center"
  transition="scale-transition"
  :close-on-content-click="false"
>
  <template v-slot:activator="{ on, attrs }">
    <v-btn icon flat large v-bind="attrs" v-on="on">
      <v-icon>menu</v-icon>
    </v-btn>
  </template>


  <v-list>
    <v-list-item>
      <v-list-item-title>
        <v-flex shrink pa-1 pl-3>
          <locale-select-box />
        </v-flex>
      </v-list-item-title>
    </v-list-item>
    <v-list-item>
      <v-list-item-title>
        <v-flex shrink pa-1 pl-3>
          <remote-access-field color="inherit" />
        </v-flex>
      </v-list-item-title>
    </v-list-item>
    <v-list-item>
      <v-list-item-title>
        <v-flex shrink pa-1 pl-3>
          <v-switch label="Dark Mode" v-model="darkMode" />
        </v-flex>
      </v-list-item-title>
    </v-list-item>
  </v-list>
</v-menu>

    <v-flex shrink pa-1 pl-3>
      <locale-select-box />
    </v-flex>

    <remote-access-field color="inherit" />
  </v-layout>
</template>

<script lang="ts">
@@ -122,9 +66,6 @@ import MenuButton from "./MenuButton.vue";
  },
})
export default class CaptureToolHeader extends Vue {
submitForm: any;
openSettings: any;
darkMode: any;
  private cancelKeydown(event: Event) {
    event.stopPropagation();
  }
}
</script>
