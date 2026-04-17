from pathlib import Path
import time
import hashlib
from datetime import datetime
import os

WATCH = [Path.home()/"Downloads", Path.home()/"Desktop"]
OUT = Path.home()/"Documents/ObsidianVault/00_inbox"
OUT.mkdir(parents=True, exist_ok=True)

seen = set()

def hash_text(t): return hashlib.sha256(t.encode()).hexdigest()

while True:
    for folder in WATCH:
        if not folder.exists(): continue
        for f in folder.iterdir():
            if not f.is_file(): continue
            key = f"{f}-{f.stat().st_mtime}"
            if key in seen: continue
            seen.add(key)
            text = f.name
            try:
                if f.suffix in ['.txt','.md']:
                    text = f.read_text()[:2000]
            except: pass
            fn = OUT / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{f.stem}.md"
            fn.write_text(f"# Capture\n\n{text}")
            print("Captured", f)
    time.sleep(30)
