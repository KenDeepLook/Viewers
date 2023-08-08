const { cache, Types, VolumeViewport } = window.sharedLibraries['@cornerstonejs/core']

const {
  drawing,
  BaseTool,
  AnnotationTool,
  Enums,
  ToolGroupManager,
  //segmentation as Segmentation,
} = window.sharedLibraries['@cornerstonejs/tools'];
const csToolsTypes = window.sharedLibraries['@cornerstonejs/tools'].Types;

const { drawLine, drawTextBox: drawTextBoxSvg } = drawing;

class DeepLookTool extends AnnotationTool {
  static toolName;
  isActive;

  constructor(
    toolProps: csToolsTypes.PublicToolProps = {},
    defaultToolProps: csToolsTypes.ToolProps = {
      configuration: {},
    }
  ) {
    super(toolProps, defaultToolProps);
    this.isActive = true;
  }

  /** These functions are not necessary for this tool but needs to be defined
   * since it's abstract methods from the parent class.
   */

  mmToPx(mm: number): number {
    const div = document.createElement('div');
    div.style.display = 'block';
    div.style.height = '100mm';
    document.body.appendChild(div);
    const convert = (div.offsetHeight * mm) / 100;
    if (div.parentNode) {
      div.parentNode.removeChild(div);
    }
    return convert;
  }
  isPointNearTool(): boolean {
    return false;
  }

  cancel(element: HTMLDivElement): void {
    return;
  }

  mouseUpCallback = (): void => {
    alert('Pixels per mm: ' + this.mmToPx(1));
  };

  addNewAnnotation(
    evt: csToolsTypes.EventTypes.MouseDownActivateEventType,
    interactionType: 'Mouse'
  ): csToolsTypes.Annotation {
    return;
  }

  toolSelectedCallback(): void {
    return;
  }

  handleSelectedCallback(
    evt: csToolsTypes.EventTypes.InteractionEventType,
    annotation: csToolsTypes.ToolSpecificAnnotationTypes.ProbeAnnotation
  ): void {
    return;
  }

  /**
   * This function draws the labels for each segment respecting the segment
   * properties like color, segment visibility and the segment appearance in the
   * current slice. The annotation data is stored locally in the object
   * representationals
   * @param enabledElement - The Cornerstone's enabledElement.
   * @param svgDrawingHelper - The svgDrawingHelper providing the context for drawing.
   */
  renderAnnotation = (
    enabledElement: Types.IEnabledElement,
    svgDrawingHelper: csToolsTypes.SVGDrawingHelper
  ): boolean => {
    const renderStatus = false;
    return renderStatus;
  };

  // removes the annotations in case of tool disabling or turn into passive mode
  disableTool = (): void => {
    this.isActive = false;
  };

  // captures the tool activation
  onSetToolActive = (): void => {
    this.isActive = true;
  };

  // captures the tool enabling
  onSetToolEnabled = (): void => {
    this.isActive = true;
  };

  // captures the tool change to passive mode
  onSetToolPassive = (): void => {
    this.isActive = true;
  };

  // captures the tool disabling
  onSetToolDisabled = (): void => {
    this.disableTool();
  };
}

DeepLookTool.toolName = 'DeepLookTool';
export default DeepLookTool;
