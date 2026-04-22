from pathlib import Path
router = Path.home()/"Projects/ema/daemon/lib/ema_web/router.ex"
text = router.read_text()
needle = '    get("/context/executive-summary", ContextController, :executive_summary)\n'
insert = needle + '    get("/context/operator/package", ControlPlaneController, :operator_package)\n    get("/context/project/:id/package", ControlPlaneController, :project_package)\n'
if '/context/operator/package' not in text:
    text = text.replace(needle, insert, 1)
    router.write_text(text)
print('router patched for context package endpoints')
