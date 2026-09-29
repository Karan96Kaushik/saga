import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';

const { audio, video, file, ...blockSpecs } = defaultBlockSpecs;
void audio;
void video;
void file;

/** Images stay. Audio, video, and generic file blocks are left out. */
export const noteSchema = BlockNoteSchema.create({
  blockSpecs,
});
