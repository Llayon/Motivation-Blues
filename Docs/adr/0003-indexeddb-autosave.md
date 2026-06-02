# ADR 0003: IndexedDB Editor Autosave

## Status

Accepted.

## Decision

Store the active editor buffer in IndexedDB on every editor change, with localStorage fallback.

## Context

The main user fear is losing text. Supabase saves happen only on explicit draft/bank actions and may fail offline. Active writing must be protected independently from network and auth state.

## Consequences

- The editor can recover unsaved text after tab close, browser crash, or offline usage.
- Autosave writes must not block UI.
- Save/delete operations need ordered writes to avoid stale autosave records reviving after bank save.
- Future editor changes must preserve this local-first recovery guarantee.
