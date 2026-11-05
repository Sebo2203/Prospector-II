# Autosaves and recovery

The game saves locally in your browser or desktop app. The bottom status line says **Saving…**, **Saved**, or **AUTOSAVE FAILED**. Success appears after the storage transaction commits. The redundant turn counter has been removed from this indicator; saved turn metadata and recovery details are retained.

If a write fails, a persistent notice offers **Retry** and **Export save**. Your last committed save is retained. Export downloads your current game, including progress that could not be autosaved. F5 remains the normal file-export shortcut. Returning to the menu and quitting through the game wait for the save; on failure the current career stays open for recovery/export.

The latest autosave and its previous valid copy are stored together. Continue checks their integrity and uses the previous copy if the newest is damaged, showing which captain/turn was recovered. A damaged newest copy is never rotated over a good recovery copy. If neither copy is readable, the game reports the problem; load an exported JSON file to recover.

If another game window changes the save, an older window cannot overwrite it automatically. Its notice offers **Export save** or **Load newer save**. Export first to keep that window's unsaved progress; loading the newer save replaces the game in that window.

Existing `prospector_autosave` localStorage saves remain readable. Continue applies the existing compatibility repairs, and the next successful autosave writes the result to the new storage. The original localStorage entry is retained. File import uses the same compatibility repairs; an invalid file does not replace the active run.

Saves belong to the browser profile/site or desktop app's local storage; they are not cloud saves. Exported JSON remains the portable backup. Browser storage has finite capacity and can be disabled or cleared; failures are now reported instead of silently ignored. Abrupt process termination can still lose progress that has not committed. Closing during a pending or failed save requests the browser's unsaved-progress warning.

The debug playground does not write a sandbox save. It retains the original career, and F4 restores that career as before.

## Implementation and maintenance

- `src/persistence/autosave-store.js` owns IndexedDB access, record integrity and the ordered/coalescing write queue. Database `prospector_autosaves`, schema version 1, has one `slots` store with `current` and `previous` records. Each record has envelope format 1, JSON `raw`, a checksum, timestamp and a small menu summary. The checksum detects accidental damage; it is not an authentication mechanism.
- The previous/current pair changes in one read/write transaction. Success comes from transaction completion, not a successful individual put. Strict durability is requested where supported. Aborts leave both copies unchanged. An observed-record token, checked inside that transaction, rejects stale writes from another window.
- `src/persistence/save-load.js` captures snapshots before queueing, surfaces status, supports legacy reads and file export/import, and awaits saves during menu/quit transitions. Shared compatibility normalization rolls back the active-state reference if preparation fails. Operation generations prevent an older asynchronous load from replacing a newly started game.
- Render updates schedule a bounded 200 ms save rather than immediately writing localStorage. Rapid actions share the latest pending snapshot; writes are serialized and identical snapshots are skipped. A held key cannot defer the timer indefinitely. Explicit saves and transitions flush immediately. Animation-only drawing does not schedule saves.
- The integration point still follows `renderAll` while the broader action/turn refactor is pending. This reduces writes but does not eliminate serialization caused by all UI state changes. Full world snapshots are still serialized; map deltas and a broader versioned world-state schema remain future work if measurements justify them.
- Keep `SAVE_KEY` as a legacy input, not a mirror of the durable store. Await `autoSave`, `loadFromStorage` and `loadAndRender` when a confirmed result is required. Use `readStoredAutosave` for inspection/export; do not assume localStorage contains the latest game. Preserve transaction atomicity and debug-world exclusion.

## Verify save behavior

Run `npm test` for save integrity, recovery, write ordering, and failure handling. Run `npm --prefix qa test -- autosave` for IndexedDB recovery, legacy imports, large saves, file export, stale windows, and save-before-transition behavior. [Browser test setup](../qa/README.md)

The original experimental.7 validation is recorded in the [changelog](../CHANGELOG.md#2026-10-31--028-experimental7-durable-autosaves-and-recovery). The [roadmap](roadmap.md#the-foundation-already-in-the-game) tracks related follow-up work.
