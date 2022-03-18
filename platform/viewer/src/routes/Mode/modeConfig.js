import ConfigPoint from 'config-point';

const ohif = {
  layout: 'org.ohif.default.layoutTemplateModule.viewerLayout',
  sopClassHandler: 'org.ohif.default.sopClassHandlerModule.stack',
  hangingProtocols: 'org.ohif.default.hangingProtocolModule.default',
};

const tracked = {
  measurements: 'org.ohif.measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: 'org.ohif.measurement-tracking.panelModule.seriesList',
  viewport: 'org.ohif.measurement-tracking.viewportModule.cornerstone-tracked',
};

const dicomsr = {
  sopClassHandler: 'org.ohif.dicom-sr.sopClassHandlerModule.dicom-sr',
  viewport: 'org.ohif.dicom-sr.viewportModule.dicom-sr',
};

/**
 * Define a default modeConfig that can be extended independently by inheritting
 * from this using the configBase: "modeConfig" to get the defaults here.
 * It isn't required to use this to get the defaults, but is simply provided
 * as a convenient extension point.
 * Extensions may enhance the default modeConfig by defining getSopClassHandler
 * and other related fields.
 */
const { modeConfig } = ConfigPoint.register({
  modeConfig: {
    panels: {
      leftPanels: [tracked.thumbnailList],
      rightPanels: [tracked.measurements],
      viewports: [
        // The images id names this object so that later
        // customizations to namespace/displaySetsToDisplay can simply
        // refer to it by name and then set specific values, eg:
        // viewports: { images: {namespace: myNewNamespace
        {
          id: 'images',
          namespace: tracked.viewport,
          displaySetsToDisplay: [ohif.sopClassHandler],
        },
        {
          id: 'dicomsr',
          namespace: dicomsr.viewport,
          displaySetsToDisplay: [dicomsr.sopClassHandler],
        },
      ],
    },
    // sopClassHandlers is a list of string values, where the ordering is
    // important to determine which handler will actually read a given instance.
    // Thus, this defines a sort operation, with a value reference.
    // Elements in the config point are objects with id and priority, and are
    // used to sort by priority, and then id field is extracted and placed in a list.
    // See extension-video for details on how to add a new item.
    sopClassHandlers: {
      configOperation: 'sort',
      sortKey: 'priority',
      valueReference: 'id',
      value: [
        { id: ohif.sopClassHandler, priority: 10000 },
        { id: dicomsr.sopClassHandler, priority: 1000 },
      ],
    },
    hangingProtocols: [ohif.hangingProtocols],
    layout: ohif.layout,
    extensions: [
      'org.ohif.default',
      'org.ohif.cornerstone',
      'org.ohif.measurement-tracking',
      'org.ohif.dicom-sr',
    ],
  },
});

export default modeConfig;
