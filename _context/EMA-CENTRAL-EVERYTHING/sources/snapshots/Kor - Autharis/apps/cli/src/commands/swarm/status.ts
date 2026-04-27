// `autharis swarm status` — print colorized lane table. Lane G2.
import { Command, Flags } from '@oclif/core';
import { ansi, renderTable } from '../../lib/ansi.js';
import { readLanes, resolveLanesPath, type LaneRow, type LaneStatus } from '../../lib/lanes.js';

function colorStatus(status: LaneStatus): string {
  switch (status) {
    case 'landed':
      return ansi.green(status);
    case 'in-review':
      return ansi.cyan(status);
    case 'held':
      return ansi.yellow(status);
    case 'blocked':
      return ansi.red(status);
    case 'open':
    default:
      return ansi.gray(status);
  }
}

function colorHolder(holder: string): string {
  return holder === 'open' || holder === 'user-owned' ? ansi.dim(holder) : ansi.magenta(holder);
}

export default class SwarmStatus extends Command {
  static override description = 'Print the Autharis swarm lane state from _shared/lanes.md.';
  static override examples = [
    '<%= config.bin %> swarm status',
    '<%= config.bin %> swarm status --status open',
    '<%= config.bin %> swarm status --file ./autharis/_shared/lanes.md',
  ];

  static override flags = {
    file: Flags.string({ char: 'f', description: 'Path to lanes.md', required: false }),
    status: Flags.string({ char: 's', description: 'Filter by status', required: false }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SwarmStatus);
    const file = flags.file ?? resolveLanesPath();
    let rows: LaneRow[];
    try {
      rows = readLanes(file);
    } catch (err) {
      this.error(`Could not read lanes file at ${file}: ${(err as Error).message}`);
    }
    const filtered = flags.status ? rows.filter((r) => r.status === flags.status) : rows;
    if (filtered.length === 0) {
      this.log(ansi.dim('(no lanes matched)'));
      return;
    }
    const tableRows = filtered.map((r) => [
      ansi.bold(r.id),
      colorStatus(r.status),
      colorHolder(r.holder),
      r.shortName,
    ]);
    this.log(renderTable(['Lane', 'Status', 'Holder', 'Short name'], tableRows));
    this.log('');
    this.log(ansi.dim(`source: ${file}  •  ${filtered.length} lane(s)`));
  }
}
