import { toolNames } from "./initCornerstoneTools";
import { Enums as csToolsEnums} from "@cornerstonejs/tools";

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

export const addTools = (toolGroup, configs) => {
  const toolNames = _getToolNames(tools);
  toolNames.forEach((toolName) => {
    const toolConfig = configs[toolName] ?? {};
    toolGroup.addTool(toolName, { ...toolConfig });
  });
};

export function setToolsMode(toolGroup, tools) {
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

export const tools = {
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
    { toolName: toolNames.Length },
    { toolName: toolNames.ArrowAnnotate },
    { toolName: toolNames.Bidirectional },
    { toolName: toolNames.DragProbe },
    { toolName: toolNames.EllipticalROI },
    { toolName: toolNames.CircleROI },
    { toolName: toolNames.RectangleROI },
    { toolName: toolNames.StackScroll },
    { toolName: toolNames.Angle },
    { toolName: toolNames.Magnify },
    { toolName: toolNames.PlanarFreehandROI },
  ],
  // enabled
  // disabled
  //disabled: [{}], //toolName: toolNames.ReferenceLines
};