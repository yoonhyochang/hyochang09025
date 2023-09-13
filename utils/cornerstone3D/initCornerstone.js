import initProviders from "./initProviders";
import initCornerstoneDICOMImageLoader from "./initCornerstoneDICOMImageLoader";
import initVolumeLoader from "./initVolumeLoader";
import { init as csRenderInit } from "@cornerstonejs/core";
import initCornerstoneTools from "./initCornerstoneTools";
import initSR from "utils/cornerstone-dicom-sr/src/init";

export default async function initDemo() {
  initProviders();
  initCornerstoneDICOMImageLoader();
  initVolumeLoader();
  await csRenderInit();
  initCornerstoneTools();
  initSR({});
}
