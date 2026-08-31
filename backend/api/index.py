import sys
import os
from pathlib import Path

current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent

for p in [str(current_dir), str(backend_dir), os.getcwd()]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app
