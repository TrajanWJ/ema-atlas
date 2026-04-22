"""
Argument parser — stdlib only, no argparse.
Shared between old and new CLI entry points.
"""


class Args:
    def __init__(self, positional, flags):
        self.pos = positional
        self.flags = flags

    def get(self, key, default=None):
        return self.flags.get(key, default)

    def has(self, key):
        return key in self.flags

    def format(self):
        return self.flags.get("format", "json")


def parse_args(argv):
    pos = []
    flags = {}
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg.startswith("--"):
            arg = arg[2:]
            if "=" in arg:
                k, v = arg.split("=", 1)
                flags[k] = v
            elif i + 1 < len(argv) and not argv[i + 1].startswith("--"):
                flags[arg] = argv[i + 1]
                i += 1
            else:
                flags[arg] = True
        elif arg.startswith("-") and len(arg) == 2:
            # Short flags like -j, -H
            key = arg[1:]
            if i + 1 < len(argv) and not argv[i + 1].startswith("-"):
                flags[key] = argv[i + 1]
                i += 1
            else:
                flags[key] = True
        else:
            pos.append(arg)
        i += 1
    return Args(pos, flags)
