"""
EMA CLI configuration management.
Config file: ~/.config/ema/cli.json
Priority: CLI flag > env var > config file > default
"""
import json
import os
from pathlib import Path

CONFIG_PATH = Path(os.environ.get("EMA_CONFIG", Path.home() / ".config/ema/cli.json"))

_DEFAULTS = {
    "host": "localhost:4488",
    "output": "human",
    "active_space": None,
    "timeout": 10,
}

_config: dict | None = None


def load():
    global _config
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH) as f:
                _config = {**_DEFAULTS, **json.load(f)}
            return
        except Exception:
            pass
    _config = dict(_DEFAULTS)


def save():
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_PATH, "w") as f:
        json.dump(_config, f, indent=2)
    return CONFIG_PATH


def get(key, default=None):
    if _config is None:
        load()
    return _config.get(key, default)


def set_val(key, value):
    if _config is None:
        load()
    _config[key] = value


def host():
    """Return daemon host URL. Priority: EMA_HOST env > config file > default."""
    env_host = os.environ.get("EMA_HOST")
    if env_host:
        return env_host
    if _config is None:
        load()
    return _config.get("host", _DEFAULTS["host"])


def timeout():
    if _config is None:
        load()
    return int(_config.get("timeout", _DEFAULTS["timeout"]))


# Auto-load on import
load()
