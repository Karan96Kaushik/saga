import { defaultBlockSpecs } from '@blocknote/core';
const { audio, video, file, ...blockSpecs } = defaultBlockSpecs;
void audio;
void video;
void file;
/** Default note blocks. Images stay. Audio, video, and generic file blocks are left out. */
export const noteBlockSpecs = blockSpecs;
