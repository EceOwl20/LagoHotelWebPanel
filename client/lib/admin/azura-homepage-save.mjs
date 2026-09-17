export async function saveAzuraHomepageSteps(steps) {
  const saved = [];
  for (const step of steps) {
    let result;
    try {
      result = await step.save();
    } catch {
      result = "failed";
    }
    if (result === "saved") {
      saved.push(step.label);
    } else if (result !== "skipped") {
      return { saved, failed: step };
    }
  }
  return { saved, failed: null };
}
