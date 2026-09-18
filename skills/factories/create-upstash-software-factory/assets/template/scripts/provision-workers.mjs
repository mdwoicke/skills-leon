// Creates a paused Box for every enabled worker in factory.config.json that
// does not have one yet. Safe to run again. It skips workers that already have
// a Box and never deletes anything.
//
// Preview: node --env-file=.env scripts/provision-workers.mjs [worker id ...]
// Create:  node --env-file=.env scripts/provision-workers.mjs [worker id ...] --yes
//
// Name worker ids to create only those, for example one Box to build the
// worker image in before the rest are created from it.
import { loadConfig } from "../src/config.mjs"
import { createWorkerBox, describeBoxSettings } from "../src/box.mjs"
import { getWorkerStates } from "../src/workers.mjs"

const config = loadConfig()
const confirmed = process.argv.includes("--yes")
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"))
const missing = (await getWorkerStates(config)).filter((w) => w.enabled && !w.boxId && (only.length === 0 || only.includes(w.id)))

if (missing.length === 0) console.log("Every enabled worker already has a Box.")

for (const worker of missing) {
  if (!confirmed) {
    const image = config.agents[worker.agent].snapshotId ? "its own image" : config.factory.snapshotId ? "the shared image" : "a plain Box"
    console.log(`Would create ${worker.boxName} from ${image}, with ${describeBoxSettings(config, worker.agent)}`)
    continue
  }
  const box = await createWorkerBox(config, worker)
  await box.pause()
  console.log(`Created and paused ${worker.boxName} (${box.id}) with ${describeBoxSettings(config, worker.agent)}`)
}

if (!confirmed && missing.length) console.log("\nPreview only. Add --yes to create them.")
