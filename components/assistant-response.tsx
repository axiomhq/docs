'use client';

import { MessageResponse, type MessageResponseProps } from '@/components/ai-elements/message';
import { assistantSourcePaths, createAssistantUrlTransform } from '@/lib/assistant-links';

export function AssistantResponse({
  sourceUrls,
  ...props
}: MessageResponseProps & { sourceUrls: string[] }) {
  const sourcePaths = assistantSourcePaths(sourceUrls);

  return (
    // Streamdown memoizes blocks without comparing urlTransform. Remount only
    // when retrieved paths change, including results arriving after the text.
    <MessageResponse
      {...props}
      key={sourcePaths.join('\n')}
      urlTransform={createAssistantUrlTransform(sourcePaths)}
    />
  );
}
