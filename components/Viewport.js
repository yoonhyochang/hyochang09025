// 필요한 모듈과 라이브러리를 임포트
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

// 필요한 Enum 값을 디스트럭처링
const { ViewportType } = Enums;

// 주요 실행 함수
async function run(element) {
  // Init Cornerstone and related libraries
  // Cornerstone 및 관련 라이브러리 초기화
  await initCornerstone();

  // Get Cornerstone imageIds and fetch metadata into RAM
  // Cornerstone 이미지 ID 및 메타데이터 획득
  const imageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID: "1.400.20.81.610.201712061281",
    SeriesInstanceUID: "1.3.46.670589.30.1.6.1.1625523293.1512518914734.3",
    wadoRsRoot: "http://localhost/orthanc/dicom-web",
  });

  // 렌더링 엔진과 뷰포트 설정
  const renderingEngineId = "myRenderingEngine";
  const viewportId = "CT_AXIAL_STACK";
  const renderingEngine = new RenderingEngine(renderingEngineId);

  const viewportInput = {
    viewportId,
    element,
    type: ViewportType.STACK,
  };

  // 렌더링 엔진 초기화 및 뷰포트 획득
  renderingEngine.enableElement(viewportInput);
  const viewport = renderingEngine.getViewport(viewportInput.viewportId);

  const toolGroupId = "CT_TOOLGROUP";
  // Define tool groups to add the segmentation display tool to

  // 도구 그룹 생성
  //addTool(DICOMSRDisplayTool) //! why in init rs not working ?
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

  // 도구 이름을 가져오는 함수
  function _getToolNames(toolGroupTools) {
    const toolNames = [];
    if (toolGroupTools.active) {
      toolGroupTools.active.forEach((tool) => {
        toolNames.push(tool.toolName);
      });
    }
    if (toolGroupTools.passive) {
      toolGroupTools.passive.forEach((tool) => {
        toolNames.push(tool.toolName);
      });
    }

    if (toolGroupTools.enabled) {
      toolGroupTools.enabled.forEach((tool) => {
        toolNames.push(tool.toolName);
      });
    }

    if (toolGroupTools.disabled) {
      toolGroupTools.disabled.forEach((tool) => {
        toolNames.push(tool.toolName);
      });
    }

    return toolNames;
  }
  // 도구 추가 함수
  const addTools = (toolGroup, configs) => {
    const toolNames = _getToolNames(tools);
    toolNames.forEach((toolName) => {
      const toolConfig = configs[toolName] ?? {};
      toolGroup.addTool(toolName, { ...toolConfig });
    });
  };

  // 사용할 도구 설정
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
  };

  // 도구의 모드 설정 함수
  function setToolsMode(toolGroup, tools) {
    const { active, passive, enabled, disabled } = tools;

    // 각 상태별로 도구 설정
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
  // 도구와 도구 모드 설정
  addTools(toolGroup, tools);
  setToolsMode(toolGroup, tools);

  // 뷰포트 추가
  toolGroup.addViewport(viewportId, renderingEngineId);

  // set interpolation agressiveness while adding new annotation (ps: this does not change if interpolation is ON or OFF)
  // 주석 도구 설정
  toolGroup.setToolConfiguration(PlanarFreehandROITool.toolName, {
    interpolation: { knotsRatioPercentageOnAdd: 30 },
  });

  // set interpolation to be ON while editing only
  toolGroup.setToolConfiguration(PlanarFreehandROITool.toolName, {
    interpolation: { interpolateOnAdd: false, interpolateOnEdit: true },
  });
  viewport.setStack(imageIds, imageIds.length - 1);
  viewport.render();
}

// 뷰포트 컴포넌트
export default function Viewport() {
  // 참조와 상태 설정
  const viewer = useRef(null);
  const [managers, setManagers] = useState(null);
  const defaultConfig = {
    extensions: [],
  };

  useEffect(() => {
      if (window !== undefined) {
        // 초기화 및 매니저 설정
        run(viewer.current);
        const runManagerInit = async () => {
          managerInit(defaultConfig, [], [])
            .then(setManagers)
            .catch(console.error);
        };

        runManagerInit();
      }
  }, []);

  return (
    <div
      id="cornerstone-element"
      ref={viewer}
      style={{ width: 1024, height: 1024 }}
    ></div>
  );
}
