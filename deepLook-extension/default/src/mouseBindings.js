import { Enums } from '@cornerstonejs/tools';

export default function deepLookMouseBindings(toolName) {
  if (toolName === 'WindowLevel') {
    return Enums.MouseBindings.Auxiliary;
  } else if (toolName === 'Pan') {
    return Enums.MouseBindings.Secondary;
  } else if (toolName === 'Zoom') {
    return Enums.MouseBindings.Primary;
  }
  return undefined;
}
