import { markdownDocument } from '../lib/notes/markdown.ts';
import { mediaPathsFromContent } from '../lib/notes/media.ts';
import { nextAllNotesTap } from '../lib/notes/hiddenTap.ts';
import { blocksToPlainText } from '../lib/notes/plainText.ts';
import { selectNotes } from '../lib/notes/selectNotes.ts';
import type { NoteSummary, NoteTagRow } from '../lib/supabase/types.ts';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const document = [
  {
    type: 'paragraph',
    content: [{ type: 'text', text: 'Hello', styles: {} }],
  },
  {
    type: 'image',
    props: {
      url: 'https://example.supabase.co/storage/v1/object/public/note-media/user/note/photo.jpg',
      caption: 'Desk',
      previewWidth: 320,
    },
  },
  {
    type: 'storedFile',
    props: { fileId: 'abc', name: 'Budget.pdf' },
  },
  {
    type: 'bulletListItem',
    content: [{ type: 'text', text: 'Nested', styles: {} }],
    children: [
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: 'child', styles: {} }],
      },
    ],
  },
];

const plain = blocksToPlainText(document);
assert(plain.includes('Hello'), 'plain text includes paragraph text');
assert(plain.includes('Desk'), 'plain text includes image captions');
assert(plain.includes('child'), 'plain text includes nested blocks');
assert(plain.includes('Budget.pdf'), 'plain text includes linked file names');
assert(!plain.includes('abc'), 'plain text does not include file ids');
assert(!plain.includes('previewWidth'), 'plain text does not dump block props');

const paths = mediaPathsFromContent(document);
assert(paths.length === 1 && paths[0] === 'user/note/photo.jpg', 'image URLs become storage paths');
assert(mediaPathsFromContent({ url: 'https://cdn.example/other.png' }).length === 0, 'unrelated URLs are ignored');

const notes: NoteSummary[] = [
  note('1', 'Alpha', 'apples', false, null, 'nb-1', '2026-01-02T00:00:00.000Z'),
  note('2', 'Beta', 'berries', true, null, 'nb-1', '2026-01-01T00:00:00.000Z'),
  note('3', 'Gone', 'trash me', false, '2026-01-03T00:00:00.000Z', null, '2026-01-03T00:00:00.000Z'),
  note('4', 'Loose', 'unfiled pears', false, null, null, '2026-01-04T00:00:00.000Z'),
  note('5', 'Quiet', 'vault key', false, null, 'nb-1', '2026-01-05T00:00:00.000Z', true),
];

const noteTags: NoteTagRow[] = [{ note_id: '1', tag_id: 'tag-1', user_id: 'user-1' }];

const all = selectNotes(notes, noteTags, { kind: 'all' }, '');
assert(all.map((item) => item.id).join() === '2,4,1', 'pinned notes sort first, then recent');

const searched = selectNotes(notes, noteTags, { kind: 'all' }, 'pear');
assert(searched.length === 1 && searched[0]?.id === '4', 'search matches plain text');

const trashed = selectNotes(notes, noteTags, { kind: 'trash' }, '');
assert(trashed.length === 1 && trashed[0]?.id === '3', 'trash filter hides active notes');

const tagged = selectNotes(notes, noteTags, { kind: 'tag', tagId: 'tag-1' }, '');
assert(tagged.length === 1 && tagged[0]?.id === '1', 'tag filter uses note tags');

const hidden = selectNotes(notes, noteTags, { kind: 'hidden' }, '');
assert(hidden.length === 1 && hidden[0]?.id === '5', 'hidden view lists only hidden notes');
assert(selectNotes(notes, noteTags, { kind: 'all' }, 'vault').length === 0, 'search skips hidden notes');
assert(selectNotes(notes, noteTags, { kind: 'hidden' }, 'vault').length === 1, 'hidden search stays inside hidden notes');
assert(selectNotes(notes, noteTags, { kind: 'notebook', notebookId: 'nb-1' }, '').every((item) => item.id !== '5'), 'notebooks skip hidden notes');

const first = nextAllNotesTap([], 1_000);
const second = nextAllNotesTap(first.times, 1_200);
const third = nextAllNotesTap(second.times, 1_400);
assert(!first.openHidden && !second.openHidden && third.openHidden, 'three taps open hidden notes');
assert(nextAllNotesTap(second.times, 1_200 + 601).openHidden === false, 'a late third tap stays on all notes');

assert(markdownDocument('Field notes', 'Body').startsWith('# Field notes\n\nBody'), 'markdown export adds a title');
assert(!markdownDocument('Field notes', 'Body').includes('previewWidth'), 'markdown export is separate from the document');

console.log('notes checks passed');

function note(
  id: string,
  title: string,
  plainText: string,
  isPinned: boolean,
  trashedAt: string | null,
  notebookId: string | null,
  updatedAt: string,
  isHidden = false,
): NoteSummary {
  return {
    id,
    user_id: 'user-1',
    notebook_id: notebookId,
    title,
    plain_text: plainText,
    is_pinned: isPinned,
    is_hidden: isHidden,
    trashed_at: trashedAt,
    created_at: updatedAt,
    updated_at: updatedAt,
  };
}
