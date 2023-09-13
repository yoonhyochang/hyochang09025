import { activateTool, deactivateTool, isToolActive } from "./tools";
import React, { useState } from "react";

import { vec3 } from "gl-matrix";
import {
  addTool,
  BidirectionalTool,
  ToolGroupManager,
  WindowLevelTool,
  ZoomTool,
  segmentation,
  PlanarFreehandROITool,
  state,
  Enums as csToolsEnums,
  AnnotationTool,
  PanTool,
} from "@cornerstonejs/tools";
import {
  RenderingEngine,
  Enums,
  volumeLoader,
  setVolumesForViewports,
  geometryLoader,
  Types,
  getEnabledElementByIds,
  metaData,
  utilities,
} from "@cornerstonejs/core";
import {
  getAnnotationManager,
  getAnnotations,
} from "@cornerstonejs/tools/dist/esm/stateManagement/annotation/annotationState";
import { getAnnotationState } from "@cornerstonejs/tools/dist/esm/stateManagement/annotation/annotationState";
import {
  imageToWorldCoords,
  uuidv4,
} from "@cornerstonejs/core/dist/esm/utilities";
import {
  PixelDataTypedArray,
  Point2,
  Point3,
} from "@cornerstonejs/core/dist/esm/types";
import { cspine, sarcopenia, whileSpine } from "./dummROI";
import toolStyle from "@cornerstonejs/tools/dist/esm/stateManagement/annotation/config/ToolStyle";
import metadataProvider from "@cornerstonejs/core/dist/esm/utilities/calibratedPixelSpacingMetadataProvider";
import commandsModule from "@/utils/cornerstone-dicom-sr/src/commandsModule";
import * as cornerstoneTools from "@cornerstonejs/tools";
import * as cornerstone from "@cornerstonejs/core";
import { adaptersSR } from "@cornerstonejs/adapters";
import getFilteredCornerstoneToolState from "@/utils/cornerstone-dicom-sr/src/utils/getFilteredCornerstoneToolState";
import { annotation, drawing } from "@cornerstonejs/tools";
import { createDicomWebApi } from "@/utils/DicomWebDataSource";
import { api } from "dicomweb-client";
import dcmjs from "dcmjs";
import {
  processSeriesResults,
  seriesInStudy,
} from "@/utils/DicomWebDataSource/qido";
import OHIF, { DicomMetadataStore } from "@ohif/core";
import { normalizers, data, utilities as dcmUtilities, derivations } from "dcmjs";
import DICOMSRDisplayTool from "@/utils/cornerstone-dicom-sr/src/tools/DICOMSRDisplayTool";
import getSvgDrawingHelper from "@/utils/getSvgDrawingHelper";

export default function ToolsBar() {
  const { MeasurementReport } = adaptersSR.Cornerstone3D;
  const renderingEngineId = "myRenderingEngine";
  const viewportId = "CT_AXIAL_STACK";
  const toolGroupId = "CT_TOOLGROUP";
  const [active, setActive] = useState(false);
  const styles = {
    PlanarFreehandROI: {
      color: "rgb(0, 255, 0)",
      colorHighlighted: "rgb(255, 255, 15)",
      colorSelected: "rgb(220, 220, 220)",
      colorLocked: "rgb(255, 255, 0)",
      lineWidth: "3",
      lineDash: "",
      shadow: true,
    },
  };
  toolStyle.setViewportToolStyles(viewportId, styles);

  const manager = annotation.state.getAnnotationManager();

  const handleClick = (e) => {
    e.preventDefault();
    if (isToolActive(PlanarFreehandROITool.toolName, toolGroupId)) {
      deactivateTool(PlanarFreehandROITool.toolName, toolGroupId);
      setActive(false);
    } else {
      activateTool(PlanarFreehandROITool.toolName, toolGroupId);
      setActive(true);
    }
  };

  const getState = async (e) => {
    e.preventDefault();
    console.log(annotation.state.getAnnotationManager())
    // const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    // const tool = toolGroup.getToolInstance(DICOMSRDisplayTool.toolName);
    // const enabledElement = getEnabledElementByIds(viewportId, renderingEngineId);
    // const { viewport } = enabledElement;
    // console.log('viewport', viewport)
    // const { element } = viewport;
    // console.log(tool)
    //  let annotations = annotation.state.getAnnotations(
    //    DICOMSRDisplayTool.toolName,
    //    element
    //  );
    // console.log('annotations', annotations)
    // const svgDrawingHelper = getSvgDrawingHelper(element);
    // console.log("svgDrawingHelper", svgDrawingHelper);
   
    // const drawingOptions = {};
    // annotations.forEach((annotation) => {
    //   const { renderableData } = annotation?.data?.cachedStats;
    //   const annotationUID = annotation.annotationUID;
    //   renderableData.POLYLINE.map((data, index) => {
    //     const canvasCoordinates = data.map((p) =>
    //       viewport.worldToCanvas(p)
    //     );
    //     const lineUID = `${index}`;

    //     if (canvasCoordinates.length === 2) {
    //       drawing.drawLine(
    //         svgDrawingHelper,
    //         annotationUID,
    //         lineUID,
    //         canvasCoordinates[0],
    //         canvasCoordinates[1],
    //         drawingOptions
    //       );
    //     } else {
    //       console.log("drawPolyline");
    //       drawing.drawPolyline(
    //         svgDrawingHelper,
    //         annotationUID,
    //         lineUID,
    //         canvasCoordinates,
    //         drawingOptions
    //       );
    //     }
    //   });
    //  })
   
    
   
  



 }
  
  const saveSRtest = () => {
    //@ not finished?
    const toolState = {};
    const FrameOfReference = manager.getFramesOfReference();

    console.log("FrameOfReference", FrameOfReference);
    const annotations = manager.getAnnotations(FrameOfReference[0]);
    console.log("annotations", annotations);
    const toolTypes = Object.keys(annotations);
    const annotationsObj = annotations[toolTypes[0]];
    console.log("annotationsObj", annotationsObj);
    const imageID = annotationsObj[0].metadata.referencedImageId;
    // toolState[imageID] = { data: annotationsObj }
    //@ add data to toolState
    toolState[imageID] = { PlanarFreehandROI: { data: annotationsObj } };

    console.log("toolState", toolState);
    const toolData = toolState[imageID];
    console.log("toolData", toolData);
    const imageIds = Object.keys(toolState);
    console.log("imageIds", imageIds);
    const generalSeriesModule = metaData.get(
      "generalSeriesModule",
      imageIds[0]
    );
    console.log("generalSeriesModule", generalSeriesModule);
    const sopCommonModule = metaData.get("sopCommonModule", imageIds[0]);
    const ReferencedSOPSequence = {
      ReferencedSOPClassUID: sopCommonModule.sopClassUID,
      ReferencedSOPInstanceUID: sopCommonModule.sopInstanceUID,
    };

    console.log("sopCommonModule", sopCommonModule);

    console.log("metaData");

    let allMeasurementGroups = [];
    let measurementGroups = [];
    toolTypes.forEach((toolType) => {
      const group = getMeasurementGroup(
        toolType,
        toolData,
        ReferencedSOPSequence
      );
      if (group) {
        measurementGroups.push(group);
      }
    });

    allMeasurementGroups = allMeasurementGroups.concat(measurementGroups);
    console.log("allMeasurementGroups", allMeasurementGroups);
    console.log("measurementGroups", measurementGroups);
    const options = {
      PersonName: "Test",
    };
    const measurementReport = new TID1500MeasurementReport(
      { TID1501MeasurementGroups: allMeasurementGroups },
      options
    );
    console.log("measurementReport", measurementReport);
    const { TID1500, addAccessors } = dcmUtilities;

    const { StructuredReport } = derivations;

    const { Normalizer } = normalizers;
    const { TID1500MeasurementReport, TID1501MeasurementGroup } = TID1500;

    const { DicomMetaDictionary } = data;
    function getTID300ContentItem(
      tool,
      toolType,
      ReferencedSOPSequence,
      toolClass
    ) {
      const args = toolClass.getTID300RepresentationArguments(
        tool,
        worldToImageCoords
      );
      args.ReferencedSOPSequence = ReferencedSOPSequence;

      const TID300Measurement = new toolClass.TID300Representation(args);

      return TID300Measurement;
    }
    function getMeasurementGroup(toolType, toolData, ReferencedSOPSequence) {
      const toolTypeData = toolData[toolType];
      const toolClass =
        MeasurementReport.CORNERSTONE_TOOL_CLASSES_BY_TOOL_TYPE[toolType];
      if (
        !toolTypeData ||
        !toolTypeData.data ||
        !toolTypeData.data.length ||
        !toolClass
      ) {
        return;
      }

      // Loop through the array of tool instances
      // for this tool
      const Measurements = toolTypeData.data.map((tool) => {
        return getTID300ContentItem(
          tool,
          toolType,
          ReferencedSOPSequence,
          toolClass
        );
      });

      return new TID1501MeasurementGroup(Measurements);
    }
  };

  
  const addAnnotations = (e) => {
    e.preventDefault();
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    toolGroup.setToolEnabled(PlanarFreehandROITool.toolName);
    const engine = getEnabledElementByIds(viewportId, renderingEngineId);

    const viewport = engine.viewport;
    const { columnPixelSpacing, rowPixelSpacing, imageFrame } =
      viewport.getCornerstoneImage();
    const { origin } = viewport.getImageData();
    const FrameOfReferenceUID = viewport.getFrameOfReferenceUID() //|| uuidv4();
    const datapoints = roiToAnnotations(
      cspine,
      [columnPixelSpacing, rowPixelSpacing],
      imageFrame.imageId,
      origin
    );
    datapoints.forEach((point) =>
      manager.addAnnotation(point, FrameOfReferenceUID)
    );
    viewport.render();
    console.log("annotation.annotations", manager);
  };
  // const zoom = (e) => {
  //       e.preventDefault()
  //     if (isToolActive(ZoomTool.toolName, toolGroupId)) {
  //         deactivateTool(ZoomTool.toolName, toolGroupId)
  //         setActive(false)
  //     } else {
  //         activateTool(ZoomTool.toolName, toolGroupId)
  //         setActive(true)
  //     }
  // }

  // const move = (e) => {
  //     e.preventDefault()
  //     if (isToolActive(PanTool.toolName, toolGroupId)) {
  //         deactivateTool(PanTool.toolName, toolGroupId)
  //         setActive(false)
  //     } else {
  //         activateTool(PanTool.toolName, toolGroupId)
  //         setActive(true)
  //     }
  // }

  const saveAnnotations = (e) => {
    const toolState = {};
    const FrameOfReference = manager.getFramesOfReference();

    console.log("FrameOfReference", FrameOfReference);
    const annotations = manager.getAnnotations(FrameOfReference[0]);
    console.log("annotations", annotations);
    const toolTypes = Object.keys(annotations);
    const annotationsObj = annotations[toolTypes[0]];
    console.log("annotationsObj", annotationsObj);
    const imageID = annotationsObj[0].metadata.referencedImageId;
    // toolState[imageID] = { data: annotationsObj }
    //@ add data to toolState
    toolState[imageID] = { PlanarFreehandROI: { data: annotationsObj } };

    console.log("toolState", toolState);
    const toolData = toolState[imageID];
    console.log("toolData", toolData);

    // const toolState = MeasurementReport.generateToolState(naturalizedDataset);
    //  const tools = Object.getOwnPropertyNames(toolState);
    const options = {
      PatientName: "Test",
    };
    const report = MeasurementReport.generateReport(
      toolState,
      metaData,
      worldToImageCoords,
      options
    );
      console.log('report', report)
    const { dataset } = report;

    if (typeof dataset.SpecificCharacterSet === "undefined") {
      dataset.SpecificCharacterSet = "ISO_IR 192";
    }

    dataset.PatientID = "00025986";

    console.log("dataset", dataset);
    const buffer = dcmjs.data.datasetToBuffer(dataset);
    console.log(
      "buffer instanceof ArrayBuffer",
      buffer.buffer instanceof ArrayBuffer
    );
    

    const request = new XMLHttpRequest();
    request.open("POST", "http://localhost/orthanc/instances", true);
    request.setRequestHeader("Content-Type", "application/dicom");

    request.onload = function (res) {
      if (this.status === 200) {
        console.log("res", res.target.response);
      }
    };

    request.send(buffer.buffer);

    //    const filtered = manager.getAnnotations(
    //      "ac0fe8e0-4695-4d55-b0c5-ba35425ea02c",
    //      PlanarFreehandROITool.toolName
    //    );
    //    console.log('filtered', filtered)
    //     const dataSource = createDicomWebApi(
    //       {
    //         qidoRoot: "http://192.168.0.19/dicom-web",
    //         wadoRoot: "http://192.168.0.19/dicom-web",
    //       },
    //       {
    //         getAuthorizationHeader: () => {},
    //       }
    //     );
    //     console.log("dataSourse", dataSource);
    //     const module = commandsModule({});
    //     module.actions.storeMeasurements({ measurementData:filtered, dataSource:dataSource})
    // MeasurementReport.generateReport(
    //     manager.getAnnotations("29ba7cd1-11f1-464d-9a69-d456799fa392", PlanarFreehandROITool.toolName),
    //     metaData,
    //     utilities.worldToImageCoords,
    //     {}).then(report => {
    //     console.log('report', report)
    // })
  };
  const activeStyle = active ? "bg-red-500" : "bg-green-500";
  const style = "p-2 font-bold text-gray-50 border w-24 " + activeStyle;
  return (
    <div>
      <button onClick={handleClick} className={style}>
        Free Hand
      </button>
      <button onClick={addAnnotations} className={style}>
        Load ROI
      </button>
      {/* <button onClick={zoom} className={style}>zoom</button>
          <button onClick={move} className={style}>Pan</button> */}
      <button onClick={getState} className={style}>
        State
      </button>
      <button onClick={saveAnnotations} className={style}>
        Save
      </button>
    </div>
  );
}

const pointsToPolyline = (poligon, pixelSpacing, origin) => {
  return poligon.map((point) => {
    return imageToWorld(point, pixelSpacing, origin);
  });
};

const imageToWorld = (point, pixelSpacing, origin) => {
  return [
    point[0] * pixelSpacing[0] + origin[0],
    point[1] * pixelSpacing[1] + origin[1],
    origin[2],
  ];
};

const generateDataPoints = (poligon, pixelSpacing, imageId, origin) => {
  return {
    highlighted: false,
    invalidated: true,
    metadata: {
      viewPlaneNormal: [0, 0, -1],
      viewUp: [0, -1, 0],
      referencedImageId: imageId,
      toolName: "PlanarFreehandROI",
    },
    data: {
      handles: {
        points: [],
        activeHandleIndex: null,
        textBox: {
          hasMoved: false,
          worldPosition: [0, 0, 0],
          worldBoundingBox: {
            topLeft: [0, 0, 0],
            topRight: [0, 0, 0],
            bottomLeft: [0, 0, 0],
            bottomRight: [0, 0, 0],
          },
        },
      },
      polyline: pointsToPolyline(poligon, pixelSpacing, origin),
      label: "AI",
      cachedStats: {},
      isOpenContour: false,
    },
    annotationUID: uuidv4(),
    isLocked: false,
    isVisible: true,
  };
};

const roiToAnnotations = (roi, pixelSpacing, imageId, origin) => {
  return roi.map((poligon) =>
    generateDataPoints(poligon, pixelSpacing, imageId, origin)
  );
};

function worldToImageCoords(imageId, worldCoords) {
  const imagePlaneModule = metaData.get("imagePlaneModule", imageId);

  if (!imagePlaneModule) {
    throw new Error(`No imagePlaneModule found for imageId: ${imageId}`);
  }

  // For the image coordinates we need to calculate the transformation matrix
  // from the world coordinates to the image coordinates.

  let {
    columnCosines,
    rowCosines,
    imagePositionPatient: origin,
  } = imagePlaneModule;
  rowCosines ||= [1, 0, 0];
  origin ||= [0, 0, 0];
  columnCosines ||= [0, 1, 0];
  let { columnPixelSpacing, rowPixelSpacing } = imagePlaneModule;
  // Use ||= to convert null and 0 as well as undefined to 1
  columnPixelSpacing ||= 1;
  rowPixelSpacing ||= 1;

  // The origin is the image position patient, but since image coordinates start
  // from [0,0] for the top left hand of the first pixel, and the origin is at the
  // center of the first pixel, we need to account for this.
  const newOrigin = vec3.create();

  vec3.scaleAndAdd(newOrigin, origin, columnCosines, -columnPixelSpacing / 2);
  vec3.scaleAndAdd(newOrigin, newOrigin, rowCosines, -rowPixelSpacing / 2);

  // Get the subtraction vector from the origin to the world coordinates
  const sub = vec3.create();
  vec3.sub(sub, worldCoords, newOrigin);

  // Projected distance of the sub vector onto the rowCosines
  const rowDistance = vec3.dot(sub, rowCosines);

  // Projected distance of the sub vector onto the columnCosines
  const columnDistance = vec3.dot(sub, columnCosines);

  const imageCoords = [
    rowDistance / rowPixelSpacing,
    columnDistance / columnPixelSpacing,
  ];

  return imageCoords;
}

// function imageToWorldCoords(
//   imageId,
//   imageCoords
// ) {
//   const imagePlaneModule = metaData.get('imagePlaneModule', imageId);

//   if (!imagePlaneModule) {
//     throw new Error(`No imagePlaneModule found for imageId: ${imageId}`);
//   }

//   let {
//     columnCosines,
//     rowCosines,
//     imagePositionPatient: origin,
//   } = imagePlaneModule;
//   rowCosines ||= [1, 0, 0];
//   origin ||= [0, 0, 0];
//   columnCosines ||= [0, 1, 0];
//   let { columnPixelSpacing, rowPixelSpacing } = imagePlaneModule;
//   Use ||= to convert null and 0 as well as undefined to 1
//   columnPixelSpacing ||= 1;
//   rowPixelSpacing ||= 1;

//   calculate the image coordinates in the world space
//   const imageCoordsInWorld = vec3.create();

//   move from origin in the direction of the row cosines with the amount of
//   row pixel spacing times the first element of the image coordinates vector
//   vec3.scaleAndAdd(
//     imageCoordsInWorld,
//     origin,
//     rowCosines,
//     to accommodate the [0,0] being on the top left corner of the top left pixel
//     but the origin is at the center of the top left pixel
//     rowPixelSpacing * (imageCoords[0] - 0.5)
//   );

//   vec3.scaleAndAdd(
//     imageCoordsInWorld,
//     imageCoordsInWorld,
//     columnCosines,
//     columnPixelSpacing * (imageCoords[1] - 0.5)
//   );

//   return Array.from(imageCoordsInWorld);
// }

function _httpRequest(url, method, headers = {}, options = {}) {
  const errorInterceptor = options.errorInterceptor || (() => undefined);
  const requestHooks = options.requestHooks;
  const verbose = options.verbose !== false;
  return new Promise((resolve, reject) => {
    let request = options.request ? options.request : new XMLHttpRequest();

    request.open(method, url, true);
    if ("responseType" in options) {
      request.responseType = options.responseType;
    }

    if (typeof headers === "object") {
      Object.keys(headers).forEach((key) => {
        request.setRequestHeader(key, headers[key]);
      });
    }

    // now add custom headers from the user
    // (e.g. access tokens)
    // const userHeaders = headers;
    // Object.keys(userHeaders).forEach(key => {
    //   request.setRequestHeader(key, userHeaders[key]);
    // });

    // Event triggered when upload starts
    request.onloadstart = function onloadstart() {
      // console.log('upload started: ', url)
    };

    // Event triggered when upload ends
    request.onloadend = function onloadend() {
      // console.log('upload finished')
    };

    // Handle response message
    request.onreadystatechange = () => {
      if (request.readyState === 4) {
        if (request.status === 200) {
          resolve(request.response);
        } else if (request.status === 202) {
          if (verbose) {
            console.warn("some resources already existed: ", request);
          }
          resolve(request.response);
        } else if (request.status === 204) {
          if (verbose) {
            console.warn("empty response for request: ", request);
          }
          resolve([]);
        } else {
          const error = new Error("request failed");
          error.request = request;
          error.response = request.response;
          error.status = request.status;
          if (verbose) {
            console.error("request failed: ", request);
            console.error(error);
            console.error(error.response);
          }

          errorInterceptor(error);

          reject(error);
        }
      }
    };

    // Event triggered while download progresses
    if ("progressCallback" in options) {
      if (typeof options.progressCallback === "function") {
        request.onprogress = options.progressCallback;
      }
    }

    if (requestHooks && areValidRequestHooks(requestHooks)) {
      const combinedHeaders = Object.assign({}, headers, this.headers);
      const metadata = { method, url, headers: combinedHeaders };
      const pipeRequestHooks = (functions) => (args) =>
        functions.reduce((props, fn) => fn(props, metadata), args);
      const pipedRequest = pipeRequestHooks(requestHooks);
      request = pipedRequest(request);
    }

    // Add withCredentials to request if needed
    if ("withCredentials" in options) {
      if (options.withCredentials) {
        request.withCredentials = true;
      }
    }

    if ("data" in options) {
      request.send(options.data);
    } else {
      request.send();
    }
  });
}

/**
 * Performs an HTTP GET request.
 *
 * @param {String} url
 * @param {Object} headers
 * @param {Object} responseType
 * @param {Function} progressCallback
 * @return {*}
 * @private
 */
function _httpPost(
  url,
  headers,
  data,
  progressCallback,
  withCredentials,
  request
) {
  return _httpRequest(url, "post", headers, {
    data,
    progressCallback,
    withCredentials,
    request,
  });
}
function storeInstances(options, stowURL) {
  if (!("datasets" in options)) {
    throw new Error("datasets are required for storing");
  }

  let url = `${stowURL}/instances`;
  // if ('studyInstanceUID' in options) {
  //   url += `/${options.studyInstanceUID}`;
  // }

  // let url = `${this.stowURL}/studies`;
  // if ('studyInstanceUID' in options) {
  //   url += `/${options.studyInstanceUID}`;
  // }

  const { data, boundary } = multipartEncode(options.datasets);
  const headers = {
    "Content-Type": `multipart/related; type="application/dicom"; boundary="${boundary}", application/dicom`,
  };
  const { withCredentials = false } = options;
  return _httpPost(
    url,
    headers,
    data,
    options.progressCallback,
    withCredentials,
    options.request
  );
}
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

function stringToUint8Array(str) {
  const arr = new Uint8Array(str.length);
  for (let i = 0, j = str.length; i < j; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}
function multipartEncode(
  datasets,
  boundary = guid(),
  contentType = "application/dicom"
) {
  const contentTypeString = `Content-Type: ${contentType}`;
  const header = `\r\n--${boundary}\r\n${contentTypeString}\r\n\r\n`;
  const footer = `\r\n--${boundary}--`;
  const headerArray = stringToUint8Array(header);
  const footerArray = stringToUint8Array(footer);
  const headerLength = headerArray.length;
  const footerLength = footerArray.length;

  let length = 0;

  // Calculate the total length for the final array
  const contentArrays = datasets.map((datasetBuffer) => {
    const contentArray = new Uint8Array(datasetBuffer);
    const contentLength = contentArray.length;

    length += headerLength + contentLength + footerLength;

    return contentArray;
  });

  // Allocate the array
  const multipartArray = new Uint8Array(length);

  // Set the initial header
  multipartArray.set(headerArray, 0);

  // Write each dataset into the multipart array
  let position = 0;
  contentArrays.forEach((contentArray) => {
    multipartArray.set(headerArray, position);
    multipartArray.set(contentArray, position + headerLength);

    position += headerLength + contentArray.length;
  });

  multipartArray.set(footerArray, position);

  return {
    data: multipartArray.buffer,
    boundary,
  };
}
