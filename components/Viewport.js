import {
    RenderingEngine,
    Enums,
} from '@cornerstonejs/core';
import {
    createImageIdsAndCacheMetaData,
    initCornerstone,
} from '../utils/cornerstone3D';
import { useEffect, useRef, useState } from 'react';

import {
    addTool,
    ToolGroupManager,
    PlanarFreehandROITool,
    Enums as csToolsEnums,
} from '@cornerstonejs/tools';
import { toolNames } from '../utils/cornerstone3D/initCornerstoneTools'
import  DICOMSRDisplayTool from '../utils/cornerstone-dicom-sr/src/tools/DICOMSRDisplayTool';
import managerInit from './managerInit';

const { ViewportType} = Enums;
async function run(element) {
    // Init Cornerstone and related libraries
    await initCornerstone();

    // Get Cornerstone imageIds and fetch metadata into RAM
    const imageIds = await createImageIdsAndCacheMetaData({
      StudyInstanceUID: "1.400.20.81.610.0002598612943543",
      SeriesInstanceUID: "1.3.46.670589.30.1.6.1.1625523293.1622603492578.3",
      wadoRsRoot: "http://localhost/orthanc/dicom-web",
    });
   
    const renderingEngineId = 'myRenderingEngine';
    const viewportId = 'CT_AXIAL_STACK';
    const renderingEngine = new RenderingEngine(renderingEngineId);

    const viewportInput = {
        viewportId,
        element,
        type: ViewportType.STACK,
    };

    renderingEngine.enableElement(viewportInput);
    const viewport = renderingEngine.getViewport(viewportInput.viewportId);

    const toolGroupId = 'CT_TOOLGROUP';
    // Define tool groups to add the segmentation display tool to
   
    //addTool(DICOMSRDisplayTool) //! why in init rs not working ?
    const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
    
    function  _getToolNames(toolGroupTools) {
        const toolNames = [];
        if (toolGroupTools.active) {
            toolGroupTools.active.forEach(tool => {
                toolNames.push(tool.toolName);
            });
        }
        if (toolGroupTools.passive) {
            toolGroupTools.passive.forEach(tool => {
                toolNames.push(tool.toolName);
            });
        }

        if (toolGroupTools.enabled) {
            toolGroupTools.enabled.forEach(tool => {
                toolNames.push(tool.toolName);
            });
        }

        if (toolGroupTools.disabled) {
            toolGroupTools.disabled.forEach(tool => {
                toolNames.push(tool.toolName);
            });
        }

        return toolNames;
    }
    const addTools = (toolGroup, configs) => {
        const toolNames = _getToolNames(tools);
        toolNames.forEach(toolName => {
            const toolConfig = configs[toolName] ?? {}
            toolGroup.addTool(toolName, { ...toolConfig })
        })
    }
    const tools = {
        active: [
            
            {
                toolName: toolNames.Pan,
                bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }],
            },
            {
                toolName: toolNames.Zoom,
                bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }],
            },
            { toolName: toolNames.StackScrollMouseWheel, bindings: [] },
        ],
        passive: [
            { toolName: toolNames.Magnify },
            { toolName: toolNames.PlanarFreehandROI },
            { toolName: DICOMSRDisplayTool.toolName },
        ],
        // enabled
        // disabled
        //disabled: [{}],//toolName: toolNames.ReferenceLines 
    };
    function setToolsMode(toolGroup, tools) {
        const { active, passive, enabled, disabled } = tools;

        if (active) {
            active.forEach(({ toolName, bindings }) => {
                toolGroup.setToolActive(toolName, { bindings });
            });
        }

        if (passive) {
            passive.forEach(({ toolName }) => {
                toolGroup.setToolPassive(toolName);
            });
        }

        if (enabled) {
            enabled.forEach(({ toolName }) => {
                toolGroup.setToolEnabled(toolName);
            });
        }

        if (disabled) {
            disabled.forEach(({ toolName }) => {
                toolGroup.setToolDisabled(toolName);
            });
        }
    }
    addTools(toolGroup, tools)
    setToolsMode(toolGroup, tools)
 
    toolGroup.addViewport(viewportId, renderingEngineId);

    // set interpolation agressiveness while adding new annotation (ps: this does not change if interpolation is ON or OFF)
    toolGroup.setToolConfiguration(PlanarFreehandROITool.toolName, {
        interpolation: { knotsRatioPercentageOnAdd: 30 },
    });

    // set interpolation to be ON while editing only
    toolGroup.setToolConfiguration(PlanarFreehandROITool.toolName, {
        interpolation: { interpolateOnAdd: false, interpolateOnEdit: true },
    });
    viewport.setStack(imageIds, imageIds.length-1);
    viewport.render();



}

export default function Viewport() {
    const viewer = useRef(null);
    const [managers, setManagers] = useState(null);
    const defaultConfig = {
      extensions: [],
    };

    useEffect(() => {
        if (window !== undefined) {
            run(viewer.current);
            const runManagerInit = async () => {
              managerInit(defaultConfig, [], [])
                .then(setManagers)
                .catch(console.error);
            };

            runManagerInit();
        }

    }, [])
    

    
    return (<div id='cornerstone-element' ref={viewer} style={{ width: 1024, height: 1024 }}></div>
    )
}
