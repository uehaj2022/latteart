/**
 * Copyright 2021 NTT Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ActionTree } from "vuex";
import { CaptureControlState } from ".";
import { RootState } from "..";
import { WindowHandle, OperationWithNotes } from "@/lib/operationHistory/types";
import DeviceSettings from "@/lib/common/settings/DeviceSettings";
import { CaptureConfig } from "@/lib/captureControl/CaptureConfig";
import { Operation } from "@/lib/operationHistory/Operation";
import {
  CapturedOperation,
  CapturedScreenTransition,
} from "@/lib/operationHistory/CapturedOperation";
import { ResumeWindowHandlesAction } from "@/lib/captureControl/actions/ResumeWindowHandlesAction";
import { UpdateWindowHandlesAction } from "@/lib/captureControl/actions/UpdateWindowHandlesAction";

const actions: ActionTree<CaptureControlState, RootState> = {
  /**
   * Set device settings to the State.
   * @param context Action context.
   * @param payload.deviceSettings Device settings.
   */
  async setDeviceSettings(
    context,
    payload: { deviceSettings: DeviceSettings }
  ) {
    const config = payload.deviceSettings.config;
    context.commit("setBrowser", { browser: config.browser });
    context.commit("setPlatformName", { platformName: config.platformName });
    context.commit("setWaitTimeForStartupReload", {
      waitTimeForStartupReload: config.waitTimeForStartupReload,
    });
    context.commit("setPlatformVersion", {
      platformVersion: config.platformVersion,
    });
    context.commit("setExecutablePaths", {
      executablePaths: config.executablePaths,
    });

    await context.dispatch("updateDevices", {
      platformName: config.platformName,
    });
  },

  /**
   * Restore window handles from history.
   * @param context Action context.
   * @param payload.history History.
   */
  resumeWindowHandles(context, payload: { history: OperationWithNotes[] }) {
    new ResumeWindowHandlesAction({
      setWindowHandles: (windowHandles) => {
        context.commit("setWindowHandles", { windowHandles });
      },
      setIsResuming: (isResuming) => {
        context.commit("setIsResuming", { isResuming });
      },
    }).resume(payload.history.map(({ operation }) => operation));
  },

  /**
   * Set selectable window handles.
   * @param context Action context.
   * @param payload.availableWindowHandles Window handles.
   */
  updateWindowHandles(context, payload: { availableWindowHandles: string[] }) {
    new UpdateWindowHandlesAction({
      setWindowHandles: (windowHandles) => {
        context.commit("setWindowHandles", { windowHandles });
      },
    }).update(context.state.windowHandles, payload.availableWindowHandles);
  },

  /**
   * Recognize devices of the specified platform connected.
   * @param context Action context.
   * @param payload.platformName Platform name.
   */
  async updateDevices(context, payload: { platformName: string }) {
    const dispatcher = context.rootState.clientSideCaptureServiceDispatcher;

    const reply = await dispatcher.recognizeDevices(payload.platformName);

    if (reply.succeeded) {
      context.commit("setDevices", { devices: reply.data ?? [] });
      context.commit("setDevice", {
        device:
          context.state.config.devices.length > 0
            ? context.state.config.devices[0]
            : { deviceName: "", modelNumber: "", osVersion: "" },
      });
    } else {
      const errorMessage = context.rootGetters.message(
        `error.capture_control.${reply.error!.code}`
      );
      throw new Error(errorMessage);
    }
  },

  /**
   * Load device settings from the repository.
   * @param context Action context.
   */
  async readDeviceSettings(context) {
    const reply = await context.rootState.repositoryServiceDispatcher.getDeviceSettings();

    if (reply === null) {
      return;
    }

    if (reply.succeeded) {
      await context.dispatch("setDeviceSettings", {
        deviceSettings: reply.data,
      });
    } else {
      const errorMessage = context.rootGetters.message(
        `error.capture_control.${reply.error!.code}`
      );
      throw new Error(errorMessage);
    }
  },

  /**
   * Save device settings in the repository.
   * @param context Action context.
   * @param payload.config Capture config.
   */
  async writeDeviceSettings(context, payload: { config: CaptureConfig }) {
    const deviceSettings: DeviceSettings = {
      config: {
        platformName: payload.config.platformName,
        browser: payload.config.browser,
        device: payload.config.device,
        platformVersion: payload.config.platformVersion,
        waitTimeForStartupReload: payload.config.waitTimeForStartupReload,
        executablePaths: payload.config.executablePaths,
      },
    };
    const reply = await context.rootState.repositoryServiceDispatcher.saveDeviceSettings(
      deviceSettings
    );

    if (reply === null) {
      return;
    }

    if (!reply.succeeded) {
      const errorMessage = context.rootGetters.message(
        `error.capture_control.${reply.error!.code}`
      );
      throw new Error(errorMessage);
    }
  },

  /**
   * Replay operations.
   * @param context Action context.
   * @param payload.operations Operations.
   */
  async replayOperations(
    context,
    payload: { operations: Operation[] }
  ): Promise<string | undefined> {
    context.commit("setIsReplaying", { isReplaying: true });

    const reply = await context.rootState.clientSideCaptureServiceDispatcher.runOperations(
      context.state.config,
      payload.operations
    );

    context.commit("setIsReplaying", { isReplaying: false });

    if (reply.error) {
      const errorMessage = context.rootGetters.message(
        `error.capture_control.${reply.error!.code}`
      );
      throw new Error(errorMessage);
    }
    return reply.data;
  },

  /**
   * Stop replaying operations.
   * @param context Action context.
   */
  async forceQuitReplay(context) {
    context.rootState.clientSideCaptureServiceDispatcher.forceQuitRunningOperation();
  },

  /**
   * Switch capturing window.
   * @param context Action context.
   * @param payload.to Destination window handle.
   */
  switchCapturingWindow(context, payload: { to: string }) {
    context.rootState.clientSideCaptureServiceDispatcher.switchCapturingWindow(
      payload.to
    );
  },

  switchCancel(context) {
    context.rootState.clientSideCaptureServiceDispatcher.switchCancel();
  },

  selectCapturingWindow(context) {
    context.rootState.clientSideCaptureServiceDispatcher.selectCapturingWindow();
  },

  /**
   * Go back to previous page on the test target browser.
   * @param context Action context.
   */
  browserBack(context) {
    context.rootState.clientSideCaptureServiceDispatcher.browserBack();
  },

  /**
   * Go forward to next page on the test target browser.
   * @param context Action context.
   */
  browserForward(context) {
    context.rootState.clientSideCaptureServiceDispatcher.browserForward();
  },

  /**
   * Pause capturing.
   * @param context Action context.
   */
  pauseCapturing(context) {
    context.rootState.clientSideCaptureServiceDispatcher.pauseCapturing();
  },

  /**
   * Resume capturing.
   * @param context Action context.
   */
  resumeCapturing(context) {
    context.rootState.clientSideCaptureServiceDispatcher.resumeCapturing();
  },

  /**
   * Start capture.
   * @param context Action context.
   * @param payload.url Target URL.
   * @param payload.config Capture config.
   * @param payload.callbacks.onChangeTime The callback when the time has passed.
   * @param payload.callbacks.onChangeNumberOfWindows
   *            The callback when the number of opened windows on the test target browser.
   */
  async startCapture(
    context,
    payload: {
      url: string;
      config: CaptureConfig;
      callbacks: {
        onChangeTime: (time: string) => void;
        onChangeNumberOfWindows: () => void;
      };
    }
  ) {
    const config: CaptureConfig = Object.assign(
      payload.config,
      context.state.config
    );

    try {
      const reply = await context.rootState.clientSideCaptureServiceDispatcher.startCapture(
        payload.url,
        config,
        {
          onStart: async (startTime: number) => {
            context.dispatch("stopTimer");
            context.dispatch("startTimer", {
              onChangeTime: payload.callbacks.onChangeTime,
              startTime,
            });

            context.commit("setCapturing", { isCapturing: true });
            context.commit("operationHistory/clearUnassignedIntentions", null, {
              root: true,
            });

            const testOption = (context.rootState as any).captureControl
              .testOption;

            if (testOption.firstTestPurpose) {
              const {
                sequence,
              } = (context.rootState as any).operationHistory.selectedOperationNote;

              context.commit(
                "operationHistory/selectOperationNote",
                {
                  selectedOperationNote: { sequence: null, index: null },
                },
                {
                  root: true,
                }
              );

              await context.dispatch(
                "operationHistory/saveIntention",
                {
                  noteEditInfo: {
                    oldSequence: sequence ?? undefined,
                    newSequence: sequence ?? undefined,
                    note: testOption.firstTestPurpose,
                    noteDetails: testOption.firstTestPurposeDetails,
                    shouldTakeScreenshot: false,
                  },
                },
                {
                  root: true,
                }
              );
            }
          },
          onGetOperation: async (capturedOperation: CapturedOperation) => {
            if (capturedOperation.type === "switch_window") {
              context.commit("setCurrentWindow", {
                currentWindow: capturedOperation.input,
              });
            }

            await context.dispatch(
              "operationHistory/registerOperation",
              {
                operation: capturedOperation,
              },
              { root: true }
            );
          },
          onGetScreenTransition: async (
            capturedScreenTransition: CapturedScreenTransition
          ) => {
            const capturedOperation = {
              input: "",
              type: "screen_transition",
              elementInfo: null,
              title: capturedScreenTransition.title,
              url: capturedScreenTransition.url,
              imageData: capturedScreenTransition.imageData,
              windowHandle: capturedScreenTransition.windowHandle,
              timestamp: capturedScreenTransition.timestamp,
              screenElements: [],
              pageSource: capturedScreenTransition.pageSource,
              inputElements: [],
            };

            await context.dispatch(
              "operationHistory/registerOperation",
              {
                operation: capturedOperation,
              },
              { root: true }
            );
          },
          onChangeBrowserHistory: (browserStatus: {
            canGoBack: boolean;
            canGoForward: boolean;
          }) => {
            console.log(JSON.stringify(browserStatus));
            context.commit("setCanDoBrowserBack", {
              canDoBrowserBack: browserStatus.canGoBack,
            });
            context.commit("setCanDoBrowserForward", {
              canDoBrowserForward: browserStatus.canGoForward,
            });
          },
          onUpdateAvailableWindows: (updatedWindowsInfo: {
            windowHandles: string[];
            currentWindowHandle: string;
          }) => {
            if (updatedWindowsInfo.windowHandles.length === 0) {
              return;
            }

            context.dispatch("updateWindowHandles", {
              availableWindowHandles: updatedWindowsInfo.windowHandles,
            });

            context.commit("setAvailableWindows", {
              availableWindows: context.state.windowHandles.filter(
                (windowHandle: WindowHandle) => {
                  return windowHandle.available;
                }
              ),
            });

            context.commit("setCurrentWindow", {
              currentWindow: updatedWindowsInfo.currentWindowHandle,
            });

            if (updatedWindowsInfo.windowHandles.length > 1) {
              payload.callbacks.onChangeNumberOfWindows();
            }
          },
          onChangeAlertVisibility: (data: { isVisible: boolean }) => {
            context.commit("setAlertVisible", data);
          },
          onPause: () => {
            context.commit("setPaused", { isPaused: true });
          },
          onResume: () => {
            context.commit("setPaused", { isPaused: false });
          },
        }
      );

      if (reply.error) {
        const errorMessage = context.rootGetters.message(
          `error.capture_control.${reply.error!.code}`
        );
        throw new Error(errorMessage);
      }
    } finally {
      context.dispatch("endCapture");

      context.commit("setCapturing", { isCapturing: false });
      context.commit("setPaused", { isPaused: false });
      context.commit("setCurrentWindow", { currentWindow: "" });
      context.commit("setAvailableWindows", { availableWindows: [] });
    }
  },

  /**
   * End capture.
   * @param context Action context.
   */
  endCapture(context) {
    context.dispatch("stopTimer");
    context.rootState.clientSideCaptureServiceDispatcher.endCapture();
  },

  /**
   * Start the timer to measure capture time.
   * @param context Action context.
   * @param payload.onChangeTime The callback when the time has passed.
   */
  startTimer(
    context,
    payload: { onChangeTime: (time: string) => void; startTime: number }
  ) {
    context.state.timer.start(payload.onChangeTime, payload.startTime);
  },

  /**
   * Stop the timer to measure capture time.
   * @param context Action context.
   */
  stopTimer(context) {
    context.state.timer.stop();
  },

  /**
   * Take a screenshot of current screen on the test target browser.
   * @param context Action context.
   * @returns Screenshot.(base64)
   */
  async takeScreenshot(context) {
    if (!context.state.isCapturing) {
      return;
    }

    return await context.rootState.clientSideCaptureServiceDispatcher.takeScreenshot();
  },
};

export default actions;
