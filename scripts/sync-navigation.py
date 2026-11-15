"""Embed the shared navigation in the main page, which permits inline scripts only."""
from pathlib import Path
import re

repo = Path(__file__).resolve().parents[1]
page = repo / "index.html"
source = page.read_text()
css = (repo / "assets/navigation.css").read_text()
js = (repo / "assets/navigation.js").read_text().replace("</script", "<\\/script")
style = '<style id="shared-navigation-style">\n' + css + '\n</style>'
script = '<script id="shared-navigation-script" data-trip-root="./">\n' + js + '\n</script>'
source, styles = re.subn(r'<style id="shared-navigation-style">.*?</style>|<link rel="stylesheet" href="assets/navigation.css">', lambda _: style, source, flags=re.S)
source, scripts = re.subn(r'<script id="shared-navigation-script"[^>]*>.*?</script>|<script src="assets/navigation.js"></script>', lambda _: script, source, flags=re.S)
assert styles == scripts == 1
page.write_text(source)
print("Synced shared navigation without changing the main page's content policy.")
