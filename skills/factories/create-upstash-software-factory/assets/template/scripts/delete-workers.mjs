// Deletes worker Boxes so they can be recreated from the worker image. Deleting
// a Box is permanent. Worker Boxes hold nothing of value between jobs, but busy
// workers are always skipped.
//
// Preview:            node --env-file=.env scripts/delete-workers.mjs
// Delete all free:    node --env-file=.env scripts/delete-workers.mjs --yes
// Keep some workers:  node --env-file=.env scripts/delete-workers.mjs --keep claude-01 --yes
//
// Afterwards run scripts/provision-workers.mjs --yes to create them again.
import { Box } from "@upstash/box"
import { loadConfig } from "../src/config.mjs"
import { getWorkerStates } from "../src/workers.mjs"

const args = process.argv.slice(2)
const confirmed = args.includes("--yes")
const keepIndex = args.indexOf("--keep")
const keep = keepIndex >= 0 ? args[keepIndex + 1].split(",") : []

const states = await getWorkerStates(loadConfig())
const targets = states.filter((w) => w.boxId && w.state !== "busy" && !keep.includes(w.id))
for (const w of states.filter((w) => w.boxId && !targets.includes(w))) console.log(`Keeping ${w.boxName} (${w.state})`)

if (targets.length === 0) {
  console.log("Nothing to delete.")
} else {
  console.log(`${confirmed ? "Deleting" : "Would delete"} ${targets.length} worker Boxes:`)
  for (const w of targets) console.log(`  ${w.boxName} (${w.boxId})`)
  if (confirmed) {
    await Box.delete({ boxIds: targets.map((w) => w.boxId) })
    console.log("Deleted. Run scripts/provision-workers.mjs --yes to create them again.")
  } else {
    console.log("\nPreview only. Add --yes to delete them for good.")
  }
}
