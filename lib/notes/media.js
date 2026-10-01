const MARKERS = ['/object/public/note-media/', '/object/sign/note-media/', '/note-media/'];
function pathFromUrl(value) {
    for (const marker of MARKERS) {
        const index = value.indexOf(marker);
        if (index === -1)
            continue;
        const rest = value.slice(index + marker.length).split('?')[0] ?? '';
        if (!rest)
            return null;
        try {
            return decodeURIComponent(rest);
        }
        catch {
            return rest;
        }
    }
    return null;
}
function visit(value, paths) {
    if (typeof value === 'string') {
        const path = pathFromUrl(value);
        if (path)
            paths.add(path);
        return;
    }
    if (Array.isArray(value)) {
        value.forEach((item) => visit(item, paths));
        return;
    }
    if (value && typeof value === 'object') {
        Object.values(value).forEach((item) => visit(item, paths));
    }
}
/** Storage paths referenced by image blocks inside a BlockNote document. */
export function mediaPathsFromContent(content) {
    const paths = new Set();
    visit(content, paths);
    return [...paths];
}
