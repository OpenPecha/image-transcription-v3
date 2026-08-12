# Image Transcription V3 Workflows

The frontend uses the `imagetranscriptionv3` backend workflow: three
double-blind annotators followed by one reviewer.

## User roles

| Role | Slug | Responsibilities |
|---|---|---|
| Admin | `admin` | Manages users, groups, and batches. |
| Annotator | `annotator` | Corrects baseline OCR text in one of three annotation slots. |
| Reviewer | `reviewer` | Resolves the three annotations, then approves or rejects the task. |

Users without a role remain on the Pending Approval page until an admin assigns
one. A reviewer cannot review a task they annotated.

## Task state machine

```text
pending
  -> annotating -> annotated_a
  -> annotating_b -> annotated_b
  -> annotating_c -> annotated
  -> reviewing -> reviewed
```

`reviewed` is the terminal completed state. `trashed` is also terminal.

| State | Meaning |
|---|---|
| `pending` | Waiting for Annotator A |
| `annotating` | Annotator A is editing |
| `annotated_a` | Annotator A submitted |
| `annotating_b` | Annotator B is editing |
| `annotated_b` | Annotator B submitted |
| `annotating_c` | Annotator C is editing |
| `annotated` | All annotators submitted; waiting for review |
| `reviewing` | The reviewer is resolving the annotations |
| `reviewed` | Review approved and complete |
| `trashed` | Annotator A rejected an unusable task |

## Double-blind annotation

- Annotators A, B, and C must be different users.
- Annotators B and C start from baseline OCR delivered as `task_transcript`
  (`COALESCE` of their slot and `InitialTranscript`), never another annotator's
  work.
- Annotator A is the only slot allowed to trash a task.
- Annotators B and C must submit their work and cannot trash.
- The reviewer receives the generated comparison of all three annotations.

## Review and rejection

The reviewer may approve only while the task is in `reviewing`. Approval moves
the task to `reviewed`.

For rejection, the reviewer submits a comment and a `reject_target`:

| Target | Recipient |
|---|---|
| `1` | Annotator A |
| `2` | Annotator B |
| `3` | Annotator C |
| `4` | All annotators |

Rejection comments are returned as `comment_A`, `comment_B`, and `comment_C`.

## Workspace editor

The workspace is available to Annotators and Reviewers. It contains:

- an image viewer with pan, zoom, and TIFF support;
- a configurable Tibetan text editor;
- local draft saving;
- state- and role-gated submit, approve, reject, and trash actions;
- task metadata and rejection history.

## Admin workflows

### Batch upload and reports

Admins upload task files and assign batches to groups. New tasks enter
`pending`. Batch reports summarize `pending`, `annotated_a`, `annotated_b`,
`annotated`, `reviewed`, and `trashed`; completion percentage uses `reviewed`.

### Temporarily unavailable V3 features

The backend does not yet implement batch task listing, batch CSV export, or
per-user contribution reports for `imagetranscriptionv3`. Those admin surfaces
show an unavailable notice instead of calling V2-only endpoints. Group
contribution summaries and per-group batch reports are available. Batch task
restore remains wired for use after listing support is added.
