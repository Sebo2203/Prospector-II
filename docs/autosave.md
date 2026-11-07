# Autosaves and recovery

The game saves locally in your browser or desktop app. A small status above the bottom-left version says **Saving…**, **Saved**, or **AUTOSAVE FAILED**. Success appears after the storage transaction commits. Saved turn metadata and recovery details are retained.

If a write fails, a persistent notice offers **Retry** and **Export save**. Your last committed save is retained. Export downloads your current game, including progress that could not be autosaved. F5 remains the normal file-export shortcut. Returning to the menu and quitting through the game wait for the save; on failure the current career stays open for recovery/export.

The latest autosave and its previous valid copy are stored together. Continue checks their integrity and uses the previous copy if the newest is damaged, showing which captain/turn was recovered. A damaged newest copy is never rotated over a good recovery copy. If neither copy is readable, the game reports the problem; load an exported JSON file to recover.

If another game window changes the save, an older window cannot overwrite it automatically. Its notice offers **Export save** or **Load newer save**. Export first to keep that window's unsaved progress; loading the newer save replaces the game in that window.

Experimental.52 requires a new career for persistent ship equipment and core damage. Saves from earlier builds use a different format; no migration is provided. Continue and file import share validation, and a failed import leaves the active career in place.

Saves belong to the browser profile/site or desktop app's local storage; they are not cloud saves. Exported JSON remains the portable backup. Browser storage has finite capacity and can be disabled or cleared; failures are now reported instead of silently ignored. Abrupt process termination can still lose progress that has not committed. Closing during a pending or failed save requests the browser's unsaved-progress warning.

The Debug Palette retains the original career. Choose **Debug Palette → Return to Career** to restore it.

## Implementation and maintenance

- `src/persistence/autosave-store.js` owns IndexedDB access, record integrity and the ordered/coalescing write queue. Database `prospector_autosaves`, schema version 1, has one `slots` store with `current` and `previous` records. Each record has envelope format 1, JSON `raw`, a checksum, timestamp and a small menu summary. The checksum detects accidental damage; it is not an authentication mechanism.
- The previous/current pair changes in one read/write transaction. Success comes from transaction completion, not a successful individual put. Strict durability is requested where supported. Aborts leave both copies unchanged. An observed-record token, checked inside that transaction, rejects stale writes from another window.
- `src/persistence/career-snapshot.js` owns career schema version 2. Core integrity, bypass timers, heat, shield state and absolute per-mount reload deadlines are validated before installation. Combat opponents, radio contacts, rescuers, crew dialogue actors and active casino contestants are encoded as IDs and resolved against the authoritative rosters before installation. IDs are stable across roster changes. The IndexedDB record version is separate from the career schema version.
- `src/persistence/save-load.js` captures snapshots before queueing, surfaces status, supports file export/import, and awaits saves during menu/quit transitions. Operation generations prevent an older asynchronous load from replacing a newly started game.
- Render updates schedule a bounded 200 ms save rather than immediately writing localStorage. Rapid actions share the latest pending snapshot; writes are serialized and identical snapshots are skipped. A held key cannot defer the timer indefinitely. Explicit saves and transitions flush immediately. Animation-only drawing does not schedule saves.
- The integration point still follows `renderAll` while the broader action/turn refactor is pending. This reduces writes but does not eliminate serialization caused by all UI state changes. Full world snapshots are still serialized; map deltas and a broader versioned world-state schema remain future work if measurements justify them.
- Await `autoSave`, `loadFromStorage` and `loadAndRender` when a confirmed result is required. Use `readStoredAutosave` for inspection and export. Preserve transaction atomicity and debug-world exclusion.

## Verify save behavior

Run `npm test` for save integrity, recovery, write ordering, and failure handling. Run `npm --prefix qa test -- autosave ship-combat` for IndexedDB recovery, large saves, file import and export, stale windows, save-before-transition behavior, and actor identity across reloads. [Browser test setup](../qa/README.md)

The original experimental.7 validation is recorded in the [changelog](../CHANGELOG.md#2026-10-31--028-experimental7-durable-autosaves-and-recovery). The [roadmap](roadmap.md#the-foundation-already-in-the-game) tracks related follow-up work.
