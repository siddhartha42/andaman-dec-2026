"""Refresh the embedded readiness data after editing assets/trip-readiness.json."""
from pathlib import Path
import json
import re

repo = Path(__file__).resolve().parents[1]
data = json.loads((repo / "assets/trip-readiness.json").read_text())
page = repo / "index.html"
source = page.read_text()
pattern = r'(<script type="application/json" id="trip-readiness-data">).*?(</script>)'
assert len(re.findall(pattern, source, re.S)) == 1
payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
page.write_text(re.sub(pattern, lambda m: m[1] + payload + m[2], source, flags=re.S))
print("Refreshed the shared readiness data; no reminders were activated.")
