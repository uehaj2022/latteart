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
  <v-layout>
    <v-btn
      :disabled="!isCapturing"
      @click="ConfirmationModelVisisbility=true"
      icon
      flat
      large
      :title="pauseButtonTooltip"
      :color="pauseButtonColor"
    >
      <v-icon>pause</v-icon>
    </v-btn>
  </v-layout>
  <v-layout row justify-centre>
    <v-dialog v-model="ConfirmationModelVisisbility" presistent max-width="290">
      <v-card>
        <v-card-title class="error headline" style="font-weight:bold;">{{ $store.getters.message("confirmation_dialog_box.card-title") }}</v-card-title>
        <v-card-text>{{ $store.getters.message("confirmation_dialog_box.card-content") }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat @click="ConfirmationModelVisisbility=false">{{ $store.getters.message("confirmation_dialog_box.card-button-1") }}</v-btn>
          <v-btn color="error" flat  @click="pushPauseButton" v-on:click="ConfirmationModelVisisbility=false">{{ $store.getters.message("confirmation_dialog_box.card-button-2") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class PauseButton extends Vue {
  private get isCapturing(): boolean {
    return this.$store.state.captureControl.isCapturing;
  }

  private get isPaused(): boolean {
    return this.$store.state.captureControl.isPaused;
  }

  private get pauseButtonTooltip(): string {
    if (!this.isCapturing) {
      return "";
    }
    return this.$store.getters.message(
      this.isPaused ? "app.resume-capturing" : "app.pause-capturing"
    );
  }

  private get pauseButtonColor() {
    return this.isPaused ? "yellow" : "grey darken-3";
  }

  private pushPauseButton() {
    if (this.isPaused) {
      this.$store.dispatch("captureControl/resumeCapturing");
    } else {
      this.$store.dispatch("captureControl/pauseCapturing");
    }
    
  }
  data(){
    return{
      ConfirmationModelVisisbility:false,
    };
  }
}
</script>
