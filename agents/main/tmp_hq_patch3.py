from pathlib import Path
path = Path('/home/trajan/Projects/ema/apps/renderer/src/components/hq/HQApp.tsx')
text = path.read_text()
text = text.replace('  const selectedGoalProvenance = scopedGoalProvenance[0] ?? null;\n\n  useEffect(() => {\n', '  useEffect(() => {\n')
path.write_text(text)
