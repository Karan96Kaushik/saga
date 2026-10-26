/** Remote edits apply when this copy has nothing unsaved. A read-only copy always follows the server. */
export function shouldApplyRemote(options: {
  readOnly: boolean;
  dirty: boolean;
  localTitle: string;
  localContent: string;
  remoteTitle: string;
  remoteContent: string;
}): boolean {
  const same = options.localTitle === options.remoteTitle && options.localContent === options.remoteContent;
  if (same) return false;
  if (options.readOnly) return true;
  return !options.dirty;
}
