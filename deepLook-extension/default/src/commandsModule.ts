import { Types as OhifTypes } from '@ohif/core';
import deepLookIntegration from './helpers/deepLookIntegration';
import { Enums as cs3DEnums, eventTarget } from '@cornerstonejs/core';
import deepLookMouseBindings from './mouseBindings';
import { vec3 } from 'gl-matrix';
import openURL from './helpers/openURL';

const defaultContext = 'CORNERSTONE';
const numberOfTries = 3;

const commandsModule = ({
  servicesManager,
  commandsManager,
  extensionManager,
  appConfig,
}: OhifTypes.Extensions.ExtensionParams): OhifTypes.Extensions.CommandsModule => {
  const {
    viewportGridService,
    toolGroupService,
    cornerstoneViewportService,
    uiNotificationService,
  } = servicesManager.services;
  let lastToolNameDisabled;
  let nTries = numberOfTries;
  let urlCallTries = 0;
  let heartBeatPulseId;
  let lastElementTracked;
  let canSendResetCommand = false;

  /**
   * This function resets DLPrecise whenever a camera is modified
   * @param evt
   */
  function onCameraModified(evt) {
    sendResetCommand();
  }

  /**
   * This function removes the camera modified listener function.
   */
  function removeCameraModifiedListener(): void {
    if (lastElementTracked) {
      lastElementTracked.removeEventListener(
        cs3DEnums.Events.CAMERA_MODIFIED,
        onCameraModified
      );
      lastElementTracked = undefined;
    }
  }

  /**
   * This function adds a camera modified listener callback function to the
   * event CAMERA_MODIFIED to element object that represents the active viewport
   */
  function addCameraModifiedListener() {
    if (lastElementTracked) {
      lastElementTracked.addEventListener(
        cs3DEnums.Events.CAMERA_MODIFIED,
        onCameraModified
      );
    }
  }

  /**
   * This function add a listener whenever a viewport changes its data
   * @param parameters
   */
  function onChangeViewportData(parameters): void {
    if (lastElementTracked !== parameters.detail.element) {
      removeCameraModifiedListener();
      lastElementTracked = parameters.detail.element;
    }
    addCameraModifiedListener();
  }

  /**
   * This function presents a notification message related to DeepLook integration
   * in the screen, that could be an error message or an info message
   * @param isInfoMessage true : info message, false : error message
   * @param message message to be displayed
   */
  function messageStatus(isInfoMessage, message) {
    uiNotificationService.show({
      title: 'DeepLook integration',
      message: message,
      type: isInfoMessage ? 'info' : 'error',
      duration: 2000,
    });
  }

  /**
   * This function gets the current OHIF active viewport
   * @returns
   */
  function getActiveViewport() {
    const { activeViewportIndex, viewports } = viewportGridService.getState();
    return {
      cornerstoneViewport: cornerstoneViewportService.getCornerstoneViewportByIndex(
        activeViewportIndex
      ),
      ohifViewport: viewports[activeViewportIndex],
    };
  }

  /**
   * This  function calculates the pixel to millimeter ratio. It uses the canvasToWorld
   * function to calculate the distance in millimeters of 100 pixels and uses this value
   * to calculate the ratio
   * @param xPos
   * @param yPos
   * @returns
   */
  function getPixelMM(xPos, yPos) {
    const { cornerstoneViewport: activeViewport } = getActiveViewport();
    const worldPos1 = activeViewport.canvasToWorld([0, 100]);
    const worldPos2 = activeViewport.canvasToWorld([0, 200]);
    const distance = vec3.distance(worldPos1, worldPos2);
    const pixelMM = Math.ceil((1 / distance) * 100000);
    console.log('PixelMM returned: ', pixelMM, ' Distance: ', distance);
    return {
      insideImageFrame: 1,
      pixelMM,
    };
  }

  /**
   * This function calls a custom URL protocol link that if correctly installed, it will
   * start DLPrecise. To open this link, it uses the openURL function that receives to parameters:
   *  - the url protocol to be opened
   *  - a function to be called if the url call failed. In this case it opens in a new window
   *    a web page with instructions to download a file that will install the DLPrecise in the user computer
   */
  function callDeepLookURL() {
    if (!deepLookIntegrationObject.isConnected()) {
      window.open('deeplook01a://open');
  //    urlCallTries += 1;
   //   if (urlCallTries > 1) {
   //     window.open('/installer.html', '_blank');
     // }
    }
  }


function gotError()
{
  console.log("no DeepLookProtocol");
}

function gotLoad()
{
console.log("got load");
}
  /**
   * test to see if the deeplook protocol works.
   */
  function testDeepLookProtocol()
 {
    deepLookIntegrationObject.closeDLPrecise();
    deepLookIntegrationObject.closeWebSocket();
    openURL('deeplook01a://open', gotError, gotLoad, gotError);
    
  checkConnection();
  sendHeatBeatPulse()
  }
  // This pair of functions monitors, from time to time, the connection with DLPrecise
  // If down, after a predefined number of tries, it tries to reestablish the connection by
  // starting DLPrecise with a custom URL protocol scheme described

  /**
   * This function starts the loop to check DLPrecise connection. It just calls the _checkConnection
   * to wait for the websocket connection be established
   */
  function checkConnection() {
    setTimeout(() => {
      _checkConnection();
    }, 500);
  }

  /**
   * This function checks if the connection is established. If not try to connect. After
   * enough tries (3 default), if call the function callDeepLookURL to start DLPrecise
   */
  function _checkConnection()
   {
    if (!deepLookIntegrationObject.isConnected()) 
     {
       deepLookIntegrationObject.openWebSocket();
      // callDeepLookURL();

       setTimeout(() => {
         checkConnection();
         }, 3000);
      }
    }

  /**
   * This callback function is called when a connection is established with DLPrecise
   * @returns
   */
  function openCallback() {
    // reset url call tries if connected to DLPrecise
    urlCallTries = 0;
    nTries = 0;
    return;
  }

  /**
   * This callback function is called when a connection with DLPrecise fails
   * It reactivate the mouse bindings
   * @returns
   */
  function errorCallback() {
    activateMouseBindings();
    return;
  }

  /**
   * This callback function is called when a connection with DLPrecise is closed
   * It reactivate the mouse bindings
   * @returns
   */
  function closeCallback() {
    activateMouseBindings();
    return;
  }

  function getToolGroup() {
    const { ohifViewport: activeViewport } = getActiveViewport();
    return toolGroupService.getToolGroupForViewport(activeViewport.viewportId);
  }

  /**
   * This function deactivates the mouse bindings so DLPrecise can control the mouse
   * without any image manipulation
   * @returns
   */
  function deactivateMouseBindings() {
    const toolGroup = getToolGroup();
    lastToolNameDisabled = toolGroup.getActivePrimaryMouseButtonTool();
    if (lastToolNameDisabled) {
      toolGroup.setToolDisabled(lastToolNameDisabled);
    }
    return;
  }

  /**
   * This function sends an heart beat pulse every 30 secs
   */
  function sendHeatBeatPulse() {
    heartBeatPulseId = setInterval(() => {
      deepLookIntegrationObject.heartBeat();
    }, 30000);
  }

  /**
   * Callback function called when mass view is activated
   */
  function massViewOnCallBack() {
    activateMouseBindings();
  }

  /**
   * Callback function called when mass view is deactivated
   */
  function massViewOffCallBack() {
    canSendResetCommand = true;
    deactivateMouseBindings();
  }

  /**
   * This function reactivates the mouse bindings after DLPrecise releases control
   * @returns
   */
  function activateMouseBindings() {
    if (lastToolNameDisabled) {
      commandsManager.runCommand('setToolActive', {
        toolName: lastToolNameDisabled,
      });

      const mouseBinding = deepLookMouseBindings(lastToolNameDisabled);
      if (mouseBinding) {
        const toolGroup = getToolGroup();
        toolGroup.setToolActive(lastToolNameDisabled, {
          bindings: [
            {
              mouseButton: mouseBinding,
            },
          ],
        });
      }
      lastToolNameDisabled = undefined;
    }
    return;
  }

  /**
   * This function sends a reset command to DLPrecise. The variable canSendResetCommand
   * prevents OHIF from sending various reset commands every time zoom is modified
   */
  function sendResetCommand() {
    if (canSendResetCommand) {
      deepLookIntegrationObject.resetDLPrecise();
      canSendResetCommand = false;
    }
  }
  const deepLookIntegrationObject = new deepLookIntegration(
    getPixelMM,
    massViewOnCallBack,
    massViewOffCallBack,
    messageStatus,
    openCallback,
    errorCallback,
    closeCallback
  );

  const actions = {
    isDeepLookConnected() {
      return deepLookIntegrationObject.isConnected();
    },
    closeDeepLookURL() {
      window.open('deeplook01a://close');
    },
    resetDeepLook() {
      sendResetCommand();
    },
  };

  const definitions = {
    isDeepLookConnected: {
      commandFn: actions.isDeepLookConnected,
    },
    closeDeepLookURL: {
      commandFn: actions.closeDeepLookURL,
    },
    resetDeepLook: {
      commandFn: actions.resetDeepLook,
    },
  };

  // When OHIF is closed, call closeDLPrecise command
  window.addEventListener('unload', event => {
    console.log('Closing DLPrecise and stopping heartbeat pulse');
    deepLookIntegrationObject.closeDLPrecise();
    clearInterval(heartBeatPulseId);
  });

  eventTarget.addEventListener(
    cs3DEnums.Events.STACK_VIEWPORT_NEW_STACK,
    onChangeViewportData
  );

console.log("try to open DLPrecise here");
testDeepLookProtocol();

  return { actions, defaultContext, definitions };
};

export default commandsModule;
