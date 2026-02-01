import chalk from 'chalk';

export class Output {
  constructor(private isHuman: boolean) {}

  log(data: any) {
    if (this.isHuman) {
      // For simple strings, just print
      if (typeof data === 'string') {
        console.log(data);
        return;
      }
      // For objects in human mode, we usually want specific formatting handled by caller
      // but as a fallback, print simplified YAML-ish output
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  table(headers: string[], rows: string[][]) {
    if (!this.isHuman) {
       // In JSON mode, table doesn't make sense, we expect the caller 
       // to have logged the raw array data already or we do nothing.
       // The CLI logic should pass the raw object to log() if !isHuman.
       return; 
    }
    
    // Simple table formatter
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

  error(err: any) {
    // Errors are always JSON in non-human mode for parsing
    if (this.isHuman) {
      console.error(chalk.red('ERROR:'), err.message || err);
      if (err.code) console.error(chalk.gray(`Code: ${err.code}`));
      if (err.details) console.error(chalk.gray(JSON.stringify(err.details)));
    } else {
      console.error(JSON.stringify({
        status: 'error',
        message: err.message || 'Unknown error',
        code: err.code || 'INTERNAL_ERROR',
        details: err.details
      }));
    }
  }
}