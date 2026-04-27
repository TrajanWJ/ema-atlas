// `autharis job create` — interactive job creation. Lane G2.
import { Command } from '@oclif/core';
import { ansi } from '../../lib/ansi.js';
import { makeClient } from '../../lib/config.js';
import { prompt, promptNumber } from '../../lib/prompt.js';

export default class JobCreate extends Command {
  static override description =
    'Create a new Autharis job request via interactive prompts (no inquirer dep).';
  static override examples = ['<%= config.bin %> job create'];

  public async run(): Promise<void> {
    this.log(ansi.bold('Autharis — create job request'));
    this.log(ansi.dim('Fill in the prompts. Blank uses default where shown.'));
    this.log('');

    const title = await prompt('Title');
    const category = await prompt('Category', 'Engineering');
    const client = await prompt('Client (org name)');
    const description = await prompt('Description');
    const hoursPerWeek = await promptNumber('Hours / week', 20);
    const duration = await prompt('Duration', '3 months');
    const timezone = await prompt('Timezone', 'US/Pacific');
    const rateLow = await promptNumber('Rate min ($/hr)', 80);
    const rateHigh = await promptNumber('Rate max ($/hr)', 160);
    const industry = await prompt('Industry', 'Technology');
    const skillsRaw = await prompt('Skills (comma-separated)');
    const skills = skillsRaw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const sdk = makeClient();
    this.log('');
    this.log(ansi.dim('POST /jobs …'));
    const job = await sdk.jobs.create({
      title,
      category,
      client,
      description,
      hoursPerWeek,
      duration,
      timezone,
      budget: [rateLow, rateHigh] as const,
      skills,
      industry,
    });

    this.log('');
    this.log(ansi.green('created'));
    this.log(`  id:     ${ansi.bold(job.id)}`);
    this.log(`  title:  ${job.title}`);
    this.log(`  status: ${job.status}`);
  }
}
