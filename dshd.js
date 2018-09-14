#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const Dat = require('util').promisify(require('dat-node'))
const mkdirp = require('util').promisify(require('mkdirp'))
const readFile = require('util').promisify(require('fs').readFile)
const writeFile = require('util').promisify(require('fs').writeFile)
const DAT_INPUT = '.din'
const DAT_OUTPUT = '.dout'
const QUEUE_FILE = '.dshell'

;(async function () {
  let key = process.argv[2]
  if (!key) {
    try {
      key = await readFile(path.join(DAT_INPUT, '.key'))
    } catch (e) {}
  }
  if (!key) {
    console.log(`Must provide a remote key`)
    process.exit(1)
  }
  await writeFile(path.join(DAT_INPUT, '.key'), key)
  // make folders
  await mkdirp(DAT_INPUT)
  await mkdirp(DAT_OUTPUT)
    
  // get input
  const datIn = await Dat(DAT_INPUT, { key })
  datIn.joinNetwork()

  fs.watchFile(DAT_INPUT, async (current, previous) => {
    // read command
    let command
    try {
      command = await readFile(path.join(DAT_INPUT, QUEUE_FILE), 'utf8')
    } catch (e) {}

    command && exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }
      await writeFile(path.join(DAT_OUTPUT, '.stdout'), stdout)
      await writeFile(path.join(DAT_OUTPUT, '.stderr'), stderr)
    })
  })

  // save output
  const datOut = await Dat(DAT_OUTPUT)
  datOut.importFiles({ watch: true, ignoreHidden: false })
  datOut.joinNetwork()
  console.log('Dat link is: dat://' + datOut.key.toString('hex'))
}())