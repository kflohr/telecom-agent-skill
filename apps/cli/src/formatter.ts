import chalk from 'chalk';

export class Formatter {
  constructor(private isHuman: boolean) {}

  log(data: any) {
    if (this.isHuman) {
      console.log(data); // In human mode, we expect strings or simple objects handled by caller
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  error(err: any) {
    if (this.isHuman) {
      console.error(chalk.red('ERROR:'), err.message || err);
      if (err.code) console.error(chalk.gray(`Code: ${err.code}`));
    } else {
      console.error(JSON.stringify({
        status: 'error',
        message: err.message || 'Unknown error',
        code: err.code || 'INTERNAL_ERROR',
        details: err.details
      }, null, 2));
    }
  }

  table(headers: string[], rows: string[][]) {
    if (!this.isHuman) return; // JSON mode should have already outputted the raw array
    
    // Simple table formatter for "human" mode
    const colWidths = headers.map((h, i) => {
      const maxRow = Math.max(...rows.map(r => (r[i] || '').length));
      return Math.max(h.length, maxRow) + 2;
    });

    const headerStr = headers.map((h, i) => chalk.bold(h.padEnd(colWidths[i]))).join('');
    console.log(headerStr);
    console.log(chalk.gray('-'.repeat(headerStr.length)));

    rows.forEach(row => {
      console.log(row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(''));
    });
    console.log('');
  }
}