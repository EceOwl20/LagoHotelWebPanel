import path from "node:path";
import {
  listJsonTrashEntries,
  readJsonTrashEntry,
  removeJsonTrashEntry,
  TrashStoreError,
} from "./trash-store.mjs";
import { planTrashedPageCleanup } from "./trash-retention.mjs";

export async function inspectTrashedPageCleanup({
  trashRoot,
  policy,
  now = new Date(),
}) {
  const trashDirectory = path.join(trashRoot, "pages");
  const entries = await listJsonTrashEntries(trashDirectory);
  return planTrashedPageCleanup(entries, { ...policy, now });
}

export async function applyTrashedPageCleanup({
  trashRoot,
  policy,
  now = new Date(),
}) {
  const trashDirectory = path.join(trashRoot, "pages");
  const plan = await inspectTrashedPageCleanup({ trashRoot, policy, now });
  const deletedEntries = [];
  const changedEntries = [];

  for (const candidate of plan.candidates) {
    const entryDirectory = path.join(trashDirectory, candidate.entryId);
    const currentEntry = await readJsonTrashEntry(entryDirectory);
    const metadataStillMatches =
      currentEntry.resource &&
      currentEntry.metadata?.resourceType === "dynamic-page" &&
      currentEntry.metadata.resourceId === candidate.entryId &&
      currentEntry.metadata.deletedAt === candidate.deletedAt;

    if (!metadataStillMatches) {
      changedEntries.push(candidate.entryId);
      continue;
    }

    try {
      await removeJsonTrashEntry(entryDirectory);
      deletedEntries.push(candidate.entryId);
    } catch (error) {
      if (
        error instanceof TrashStoreError &&
        error.code === "TRASH_ENTRY_NOT_FOUND"
      ) {
        changedEntries.push(candidate.entryId);
        continue;
      }

      throw error;
    }
  }

  return { ...plan, deletedEntries, changedEntries };
}
