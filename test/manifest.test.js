'use strict'

// Package-manifest integrity. Every other suite exercises the CODE; nothing before
// this file ever read package.json at all (T-105). REPORT.md lists "zero runtime
// dependencies" among its VERIFIED claims — this is what actually checks that claim,
// plus the other manifest facts a published package promises: the bin entry is the
// file people actually run, main resolves to a real module, and the files[]
// allowlist really covers what the CLI needs at runtime.

const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))

// Extract the path.join(__dirname, 'a', 'b', ...) segments assigned to `const
// constName = ...` in `fileAbs`, and resolve them relative to that file's own
// directory. Throws (rather than returning undefined/null) on no match, on an
// unparseable segment, or on an empty segment list — a silent miss here would
// let the caller compare `undefined === undefined` and pass for the wrong
// reason, which is worse than not having the test at all.
function extractPathJoinConst (fileAbs, constName) {
  const src = fs.readFileSync(fileAbs, 'utf8')
  const re = new RegExp(`const\\s+${constName}\\s*=\\s*path\\.join\\(\\s*__dirname\\s*,([^)]*)\\)`, 'g')
  const matches = [...src.matchAll(re)]
  if (matches.length === 0) {
    throw new Error(`could not find "const ${constName} = path.join(__dirname, ...)" in ${fileAbs}`)
  }
  if (matches.length > 1) {
    throw new Error(`found ${matches.length} definitions of ${constName} in ${fileAbs} — ambiguous`)
  }
  const segments = matches[0][1].split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
    const strMatch = /^(['"])(.*)\1$/.exec(s)
    if (!strMatch) throw new Error(`unparseable path.join segment "${s}" for ${constName} in ${fileAbs}`)
    return strMatch[2]
  })
  if (segments.length === 0) {
    throw new Error(`path.join(__dirname, ...) for ${constName} in ${fileAbs} has no path segments`)
  }
  return path.join(path.dirname(fileAbs), ...segments)
}

// Extract the single `require('../src/...')` target from `fileAbs`, resolved to
// an absolute path. Throws on no match or on more than one distinct match — an
// ambiguous parse must not be silently narrowed to "whichever matched first".
function extractSrcRequire (fileAbs) {
  const src = fs.readFileSync(fileAbs, 'utf8')
  const re = /require\(\s*['"](\.\.\/src\/[^'"]+)['"]\s*\)/g
  const found = new Set()
  let m
  while ((m = re.exec(src)) !== null) {
    found.add(path.resolve(path.dirname(fileAbs), m[1]))
  }
  if (found.size === 0) throw new Error(`could not find a require('../src/...') in ${fileAbs}`)
  if (found.size > 1) throw new Error(`found ${found.size} distinct src/ requires in ${fileAbs} — ambiguous`)
  return [...found][0]
}

test('bin.moon resolves to the exact file test/cli.test.js actually spawns', () => {
  assert.ok(pkg.bin && pkg.bin.moon, 'package.json has no bin.moon entry')
  const binPath = path.resolve(ROOT, pkg.bin.moon)

  const cliTestFile = path.join(__dirname, 'cli.test.js')
  const spawnedPath = extractPathJoinConst(cliTestFile, 'BIN')
  assert.ok(fs.existsSync(spawnedPath),
    `test/cli.test.js's BIN constant points at a nonexistent file: ${spawnedPath}`)

  assert.equal(binPath, spawnedPath,
    'package.json bin.moon and the BIN spawned by test/cli.test.js have diverged')
  assert.ok(fs.existsSync(binPath), `bin.moon target does not exist: ${pkg.bin.moon}`)
})

test('main resolves to the exact module test/astro.test.js actually requires', () => {
  assert.ok(pkg.main, 'package.json has no "main" field')
  const mainPath = path.resolve(ROOT, pkg.main)

  const astroTestFile = path.join(__dirname, 'astro.test.js')
  const requiredByTests = extractSrcRequire(astroTestFile)
  assert.ok(fs.existsSync(requiredByTests),
    `test/astro.test.js requires a nonexistent module: ${requiredByTests}`)

  assert.equal(mainPath, requiredByTests,
    'package.json main and the module test/astro.test.js requires have diverged')
  // require.resolve throws MODULE_NOT_FOUND if the file is missing.
  assert.doesNotThrow(() => require.resolve(mainPath))
})

test('declares zero runtime and zero dev dependencies', () => {
  for (const field of ['dependencies', 'devDependencies']) {
    const value = pkg[field]
    assert.ok(
      value === undefined || Object.keys(value).length === 0,
      `${field} is not empty: ${JSON.stringify(value)}`
    )
  }
})

test('every files[] allowlist entry exists on disk', () => {
  assert.ok(Array.isArray(pkg.files) && pkg.files.length > 0, 'files[] is missing or empty')
  for (const entry of pkg.files) {
    const abs = path.join(ROOT, entry)
    assert.ok(fs.existsSync(abs), `files[] lists "${entry}" but nothing exists there`)
  }
})

// Statically walk the local (relative-path) require graph starting from an entry
// file, resolving each dependency to a real path on disk. node: builtins and
// anything not starting with '.' are ignored deliberately — this only needs to
// find the FILES this package's own code depends on at runtime.
function localRequires (absFile) {
  const src = fs.readFileSync(absFile, 'utf8')
  const deps = []
  const re = /require\(\s*['"](\.[^'"]+)['"]\s*\)/g
  let m
  while ((m = re.exec(src)) !== null) {
    deps.push(require.resolve(path.resolve(path.dirname(absFile), m[1])))
  }
  return deps
}

function collectGraph (entryAbs) {
  const seen = new Set()
  const stack = [require.resolve(entryAbs)]
  while (stack.length > 0) {
    const file = stack.pop()
    if (seen.has(file)) continue
    seen.add(file)
    for (const dep of localRequires(file)) stack.push(dep)
  }
  return seen
}

test('every module reachable from bin.moon and main lives under a files[] entry', () => {
  // A files[] entry is either a directory prefix ("bin/", "src/") or an exact file
  // ("README.md"). Resolve each to an absolute path and classify it from disk state,
  // not from string shape, so trailing slashes in package.json don't matter.
  // path.join keeps a trailing separator when the source entry has one ("bin/" ->
  // ".../bin/"), so it is stripped here before use as a prefix — otherwise the
  // startsWith prefix below gains a doubled separator and never matches.
  const allowlist = pkg.files.map((entry) => {
    const joined = path.join(ROOT, entry)
    return joined.endsWith(path.sep) ? joined.slice(0, -path.sep.length) : joined
  })
  const isAllowed = (absPath) => allowlist.some((allowed) => {
    if (!fs.existsSync(allowed)) return false
    if (fs.statSync(allowed).isDirectory()) {
      return absPath === allowed || absPath.startsWith(allowed + path.sep)
    }
    return absPath === allowed
  })

  const graph = new Set([
    ...collectGraph(path.resolve(ROOT, pkg.bin.moon)),
    ...collectGraph(path.resolve(ROOT, pkg.main)),
  ])
  // Sanity floor: bin/moon.js alone pulls in 4 sibling src/ modules. A graph this
  // small would mean the regex walk silently found nothing, which would make every
  // assertion below vacuously true — the exact "test that can never fail" trap.
  assert.ok(graph.size >= 4, `require graph looks too small to be real: ${graph.size} module(s)`)

  for (const file of graph) {
    assert.ok(isAllowed(file), `runtime module not covered by files[]: ${path.relative(ROOT, file)}`)
  }
})
