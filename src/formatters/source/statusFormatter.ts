/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { UX } from '@salesforce/command';
import { Logger, Messages } from '@salesforce/core';
import { ResultFormatter, ResultFormatterOptions } from '../resultFormatter';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('@salesforce/plugin-source', 'status', ['humanSuccess', 'noResults']);

type StatusActualState = 'Deleted' | 'Add' | 'Changed' | 'Unchanged';
type StatusOrigin = 'Local' | 'Remote';
type StatusStateString = `${StatusOrigin} ${StatusActualState}` | `${StatusOrigin} ${StatusActualState} (Conflict)`;
export interface StatusResult {
  state: StatusStateString;
  fullName: string;
  type: string;
  filePath?: string;
  ignored?: boolean;
  conflict?: boolean;
  actualState?: StatusActualState;
  origin: StatusOrigin;
}

// sort order is state, type, fullname
const rowSortFunction = (a: StatusResult, b: StatusResult): number => {
  if (a.state.toLowerCase() === b.state.toLowerCase()) {
    if (a.type.toLowerCase() === b.type.toLowerCase()) {
      return a.fullName.toLowerCase() < b.fullName.toLowerCase() ? -1 : 1;
    }
    return a.type.toLowerCase() < b.type.toLowerCase() ? -1 : 1;
  }
  return a.state.toLowerCase() < b.state.toLowerCase() ? -1 : 1;
};

export class StatusFormatter extends ResultFormatter {
  public constructor(logger: Logger, ux: UX, options: ResultFormatterOptions, private statusRows: StatusResult[]) {
    super(logger, ux, options);
  }

  public getJson(): StatusResult[] {
    return this.statusRows;
  }

  public display(): void {
    if (this.options.concise) {
      this.statusRows = this.statusRows.filter((row) => row.ignored === false);
    }
    if (this.statusRows.length === 0) {
      this.ux.log(messages.getMessage('noResults'));
      return;
    }
    this.ux.log(messages.getMessage('humanSuccess'));
    this.ux.table(this.statusRows.sort(rowSortFunction), {
      ...(this.statusRows.some((row) => row.ignored) ? { ignored: { header: 'IGNORED' } } : {}),
      state: { header: 'STATE' },
      fullName: { header: 'FULL NAME' },
      type: { header: 'TYPE' },
      filePath: { header: 'PROJECT PATH' },
    });
  }
}
