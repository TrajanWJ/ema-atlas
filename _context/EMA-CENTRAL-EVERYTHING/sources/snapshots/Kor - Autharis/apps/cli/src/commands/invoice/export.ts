// `autharis invoice export <id>` — print a receipt-style block. Lane G2.
import { Args, Command } from '@oclif/core';
import { makeClient } from '../../lib/config.js';

function pad(label: string, value: string, width = 14): string {
  return `${label.padEnd(width, ' ')}${value}`;
}

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default class InvoiceExport extends Command {
  static override description =
    'Fetch a single invoice by id and emit a plain-text receipt (pipe-friendly, no ANSI).';
  static override examples = ['<%= config.bin %> invoice export inv_123 > invoice.txt'];

  static override args = {
    id: Args.string({ description: 'Invoice id', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(InvoiceExport);
    const client = makeClient();
    const inv = await client.invoices.get(args.id);

    const bar = '='.repeat(56);
    const thin = '-'.repeat(56);

    const lines: string[] = [];
    lines.push(bar);
    lines.push('AUTHARIS INVOICE');
    lines.push(bar);
    lines.push(pad('Invoice #', inv.id));
    lines.push(pad('Date', inv.date));
    lines.push(pad('Status', inv.status));
    lines.push(pad('Client', inv.client));
    lines.push(pad('Engagement', inv.engagement));
    lines.push(pad('Period', inv.period));
    lines.push(thin);
    lines.push(pad('Hours', String(inv.hours)));
    lines.push(pad('Rate', money(inv.rate)));
    lines.push(pad('Subtotal', money(inv.subtotal)));
    lines.push(pad('Fee', money(inv.fee)));
    lines.push(thin);
    lines.push(pad('TOTAL', money(inv.total)));
    lines.push(bar);

    // Plain text to stdout — no colors, so piping stays clean.
    process.stdout.write(lines.join('\n') + '\n');
  }
}
