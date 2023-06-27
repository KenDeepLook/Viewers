/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const resetCommand = 3; // turns off massView and clears any overlays,  used when DICOM image size is magnified or un-magnified, changed, moved, or current display is left.
const closeCommand = 4; // causes dlPrecise to exit and stop running
const heartBeatCommand = 5; // keeps dlPrecise from “exiting and stop running” because of non-use.

class deepLookIntegration {
  serverIp;
  constructor(
    getPixelMM,
    activateMouseBindings,
    deactivateMouseBindings,
    connectionStatus,
    openCallback,
    errorCallback,
    closeCallback,
    ip = 'localhost'
  ) {
    this.serverIp = ip;
    this.getPixelMM = getPixelMM;
    this.bindedProcessMessages = this.processMessages.bind(this);
    this.activateMouseBindings = activateMouseBindings;
    this.deactivateMouseBindings = deactivateMouseBindings;
    this.connectionStatus = connectionStatus;
    this.safeCloseWebSocket = false;
    this.connectionOpened = false;
    this.openCallback = openCallback;
    this.errorCallback = errorCallback;
    this.closeCallback = closeCallback;
    this.webSocket = undefined;
  }

  /**
   * This function decodes a xml message received from DLPrecise
   * @param {*} elementTag that to be decoded
   * @param {*} xml        xml message
   * @returns
   */
  getXML(elementTag, xml) {
    let startTag = '<' + elementTag + '>';
    let endTag = '</' + elementTag + '>';

    let elementStart = xml.indexOf(startTag) + startTag.length;
    let elementEnd = xml.indexOf(endTag);
    return xml.substring(elementStart, elementEnd);
  }

  /**
   * Process the messages received from DLPrecise
   * @param {*} event
   */
  processMessages(event) {
    let lesionMatchXML = event.data;

    let command = this.getXML('command', lesionMatchXML);
    let params;
    switch (command) {
      case 'xypixelpermm': {
        let xPos = this.getXML('xpos', lesionMatchXML);
        let yPos = this.getXML('ypos', lesionMatchXML);
        const { insideImageFrame, pixelMM } = this.getPixelMM(xPos, yPos);

        params = new Uint32Array(2);
        params[0] = insideImageFrame; // command - response -- 0 not found, 1 found result in param 1
        params[1] = pixelMM;
        break;
      }
      case 'massviewon': {
        params = new Uint32Array(1);
        params[0] = 1; // acknowledge got command
        console.log('MassView On\n');
        this.connectionStatus(true, 'MassView On');
        this.deactivateMouseBindings();

        break;
      }
      case 'massviewoff': {
        params = new Uint32Array(1);
        params[0] = 1; // acknowledge got command
        console.log('MassView Off\n');
        this.connectionStatus(true, 'MassView Off');
        this.activateMouseBindings();
        break;
      }
      default:
        break;
    }

    console.log('return int array');
    let i;
    for (i = 0; i < params.length; i++) {
      console.log(i + '  ' + params[i]);
    }

    this.webSocket.send(params);
  }

  /**
   * Send to DLPrecise a command to reset overlays
   */
  resetDLPrecise() {
    if (this.isConnected()) {
      const params = new Uint32Array(1);
      params[0] = resetCommand;
      this.webSocket.send(params);
    }
  }

  /**
   * Send to DLPrecise a command to close itself
   */
  closeDLPrecise() {
    if (this.isConnected()) {
      const params = new Uint32Array(1);
      params[0] = closeCommand;
      this.webSocket.send(params);
    }
  }

  /**
   * Send to DLPrecise an heartbeat pulse, indicating that OHIF and the connection is active
   */
  heartBeat() {
    if (this.isConnected()) {
      const params = new Uint32Array(1);
      params[0] = heartBeatCommand;
      this.webSocket.send(params);
    }
  }

  /**
   * This function logs messages
   * @param {*} isInfoMessage
   * @param {*} message
   */
  processLog(isInfoMessage, message) {
    console.log(message);
    this.connectionStatus(isInfoMessage, message);
  }

  /**
   * This function connects to DLPrecise local websocket server and adds all necessary listeners
   * @returns
   */
  openWebSocket() {
    if (this.isConnected()) {
      return;
    }
    this.webSocket = new WebSocket('ws://' + this.serverIp + ':44458');
    if (!this.webSocket) {
      this.connectionStatus(false, 'Could not open a connection to DeepLook');
      return;
    }
    this.webSocket.addEventListener('error', event => {
      this.processLog(
        false,
        'DeepLook connection could not be established properly'
      );
      if (this.errorCallback) {
        this.errorCallback();
      }
    });

    this.webSocket.addEventListener('open', event => {
      this.processLog(true, 'DeepLook connection established successfully');
      this.connectionOpened = true;
      if (this.openCallback) {
        this.openCallback();
      }
    });

    this.webSocket.addEventListener('close', event => {
      if (!this.safeCloseWebSocket && this.connectionOpened) {
        this.processLog(false, 'DeepLook connection lost.');
      }
      this.safeCloseWebSocket = false;
      this.connectionOpened = false;
      if (this.closeCallback) {
        this.closeCallback();
      }
    });

    this.webSocket.addEventListener('message', event => {
      this.bindedProcessMessages(event);
    });
  }

  /**
   * This function checks if the websocket connection is alive, by checking
   * the state of the websocket
   * @returns
   */
  isConnected() {
    return this.webSocket && this.webSocket.readyState === WebSocket.OPEN;
  }

  /**
   * This function closes the websocket
   */
  closeWebSocket() {
    if (this.isConnected()) {
      this.safeCloseWebSocket = true;
      this.webSocket.close();
      this.webSocket = undefined;
    }
  }
}

export default deepLookIntegration;
