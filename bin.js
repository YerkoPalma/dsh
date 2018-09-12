#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const Dat = require('util').promisify(require('dat-node'))
const readFile = require('util').promisify(require('fs').readFile)
const writeFile = require('util').promisify(require('fs').writeFile)
const DAT_INPUT = '.dat-in'
const DAT_OUTPUT = '.dat-out'
const QUEUE_FILE = '.dshell'

const key = process.argv[2]

;(async function () {
  // get input
  const datIn = await Dat(DAT_INPUT, { key })
  datIn.joinNetwork()

  fs.watchFile(DAT_INPUT, async (current, previous) => {
    // read command
    const command = await readFile(path.join(DAT_INPUT, QUEUE_FILE), 'utf8')
    console.log(command)
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