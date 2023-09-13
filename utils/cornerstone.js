import dicomParser from 'dicom-parser';
import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import cornerstoneMath from 'cornerstone-math';
import cornerstoneTools from 'cornerstone-tools';
import Hammer from 'hammerjs';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';

const initCornerstone = () => {
    try {
        // [코너스톤 툴] Cornerstone Tools
        cornerstoneTools.getModule("segmentation").configuration.segmentsPerLabelmap = 0;
        cornerstoneTools.external.cornerstone = cornerstone;
        cornerstoneTools.external.Hammer = Hammer;
        cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
        cornerstoneTools.init([
            {
                moduleName: 'globalConfiguration',
                configuration: {
                    touchEnabled: false,
                    showSVGCursors: false,
                },
            },
            {
                moduleName: 'segmentation',
                configuration: {
                    outlineWidth: 2,
                },
            },
        ]);
    
        // [WADO 이미지 로더] Image Loader
        cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
        cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;
        var config = {
            maxWebWorkers: navigator.hardwareConcurrency || 1,
            startWebWorkersOnDemand: true,
            taskConfiguration: {
                        decodeTask: {
                            initializeCodecsOnStartup: false,
                            usePDFJS: false,
                            strict: false,
                        },
                    },
          };
          cornerstoneDICOMImageLoader.webWorkerManager.initialize(config);
        //cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
        //cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
        // cornerstoneWADOImageLoader.webWorkerManager.initialize({
        //     maxWebWorkers: navigator.hardwareConcurrency || 1,
        //     startWebWorkersOnDemand: true,
        //     taskConfiguration: {
        //         decodeTask: {
        //             initializeCodecsOnStartup: false,
        //             usePDFJS: false,
        //             strict: false,
        //         },
        //     },
        // });
    } catch (e) {
        console.log(e);
    }
    return null;
}

export default initCornerstone;