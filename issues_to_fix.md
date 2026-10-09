# Issues to Fix

## 1. Per-peer `fileSeqId` collisions can break simultaneous transfers

- **Severity:** High
- **Confidence:** 9/10
- **File:** `frontend/src/features/transfer/engine/web/WebTransferHandler.ts`

Each peer allocates `fileSeqId` locally, so Peer A and Peer B can create
transfers with the same sequence ID, commonly `0`. However,
`engine.fileSeqMap` is keyed only by `fileSeqId`.

When both manifests arrive, the later one overwrites the earlier mapping.
Subsequent packets such as chunk requests, chunk data, pause, cancel, and
completion packets are resolved using the overwritten mapping. This can route
packets to the wrong transfer, causing bidirectional transfers to stall or
update the wrong file.

This also affects multiple simultaneous senders in a mesh.

### Recommended fix

Use a globally unique transfer ID, or scope the mapping by sender peer, for
example:

```ts
Map<string, Map<number, string>>
```

where the outer key is `senderPeerId` and the inner key is `fileSeqId`. The
sender identity must then be included consistently in manifest, chunk,
request, and control packets.

## 2. Interrupted browser-mesh tests can report success

- **Severity:** Low
- **Confidence:** 9/10
- **Status:** Open
- **File:** `tests/browser_mesh/runner.mjs`

When the child process is terminated by a signal, Node reports `exitCode` as
`null`. The runner converts that to `0`, so an interrupted or externally
killed mesh test exits successfully and can be interpreted by CI or scripts as
a passing test.

### Recommended fix

Return a nonzero status when `exitCode` is `null`, or derive the result from
both `exitCode` and the termination signal.

## Completed issues

### Regenerate ID does not change the active peer identity

- **Status:** Done
- **Resolution:** Removed the unused regenerate-ID controls and their
  associated peer-store actions. The feature had no practical use case and
  could display an identity different from the active signaling identity.
