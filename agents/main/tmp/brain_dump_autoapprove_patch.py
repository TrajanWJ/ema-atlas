from pathlib import Path
p = Path.home()/"Projects/ema/daemon/lib/ema/brain_dump/brain_dump.ex"
text = p.read_text()
old = '''              {:ok, ex} ->
                # Auto-approve so dispatch_if_ready fires for requires_approval: false
                Ema.Executions.approve_execution(ex.id)
'''
new = '''              {:ok, _ex} ->
                # Executions.create/1 already auto-dispatches when requires_approval is false.
                # Do not approve again here; that creates duplicate dispatch_started/running events.
                :ok
'''
if old not in text:
    raise SystemExit('expected block not found in brain_dump.ex')
p.write_text(text.replace(old, new, 1))
print('patched brain_dump auto-approve duplication')
