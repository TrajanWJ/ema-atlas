// `autharis talent list` — list talent directory. Lane G2.
import { Command, Flags } from '@oclif/core';
import { ansi, renderTable } from '../../lib/ansi.js';
import { makeClient } from '../../lib/config.js';

export default class TalentList extends Command {
  static override description = 'List talent from the Autharis API.';
  static override examples = [
    '<%= config.bin %> talent list',
    '<%= config.bin %> talent list --status Active --page 1 --page-size 20',
  ];

  static override flags = {
    status: Flags.string({ description: 'Filter by talent status', required: false }),
    category: Flags.string({ description: 'Filter by category', required: false }),
    skill: Flags.string({ description: 'Filter by skill', required: false }),
    q: Flags.string({ description: 'Free-text query', required: false }),
    page: Flags.integer({ description: 'Page number', required: false }),
    'page-size': Flags.integer({ description: 'Page size', required: false }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(TalentList);
    const client = makeClient();
    const result = await client.talent.list({
      status: flags.status as never,
      category: flags.category,
      skill: flags.skill,
      q: flags.q,
      page: flags.page,
      pageSize: flags['page-size'],
    });
    if (result.items.length === 0) {
      this.log(ansi.dim('(no talent matched)'));
      return;
    }
    const rows = result.items.map((t) => [
      ansi.bold(t.id),
      t.name,
      t.title,
      t.city,
      `$${t.rate}/hr`,
      t.status,
    ]);
    this.log(renderTable(['ID', 'Name', 'Title', 'City', 'Rate', 'Status'], rows));
    this.log('');
    this.log(
      ansi.dim(
        `page ${result.page} • ${result.items.length}/${result.total} • hasMore=${result.hasMore}`,
      ),
    );
  }
}
