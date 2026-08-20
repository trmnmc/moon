#!/usr/bin/env node
// Remove the REPORT.md backup taken by gate B. Its only job was crash-safety during
// the in-place mutation cells; cell E9 proved the restore was byte-exact, so keeping
// a stray 24 KB copy of REPORT.md inside the repo would be misleading debris.
import { rmSync, existsSync } from 'node:fs';
const bak = '/opt/targets/moon/.swarm/runs/cycle-107-REPORT.md.bak';
if (existsSync(bak)) { rmSync(bak); console.log('removed', bak); } else console.log('no backup present');
