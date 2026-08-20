#!/usr/bin/env node
// Append the cycle-107 journal block. The block lives in a sibling .md file rather
// than inline: it contains backticked code spans, which terminate a template literal.
import { appendFileSync, readFileSync } from 'node:fs';
const block = readFileSync('/opt/targets/moon/.swarm/gates/cycle-107-block.md', 'utf8');
appendFileSync('/opt/targets/moon/.swarm/journal.md', block);
console.log('journal appended,', block.length, 'chars');
