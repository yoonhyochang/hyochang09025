import {
    addTool,
    BrushTool,
    SegmentationDisplayTool,
    BidirectionalTool,
    ToolGroupManager,
    WindowLevelTool,
    ZoomTool,
    segmentation,
    PlanarFreehandROITool,
    state,
    Enums as csToolsEnums,

} from '@cornerstonejs/tools';



export const activateTool = (toolName, toolGroupId) => {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId)
    if (!toolGroup) return
    toolGroup.setToolActive(toolName, {
        bindings: [
            {
                mouseButton: csToolsEnums.MouseBindings.Primary, // Left Click
            },
        ],
    })

}

export const deactivateTool = (toolName, toolGroupId) => {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId)
    if (!toolGroup) return

    toolGroup.setToolPassive(toolName)
}

export const isToolActive = (toolName, toolGroupId) => {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId)
    if (!toolGroup) return

    const tool = toolGroup.getToolInstance(toolName)
    return tool.mode === 'Active'
}

