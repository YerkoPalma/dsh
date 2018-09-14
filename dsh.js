#!/usr/bin/env node

const vorpal = require('vorpal')()
const Dat = require('util').promisify(require('dat-node'))
const SHELL_FILE = '.dshell'
const DAT_FOLDER = '.datsrc'
const DAT_RESULTS = '.datdest'
const path = require('path')
const mkdirp = require('util').promisify(require('mkdirp'))
const fs = require('fs')
const writeFile = require('util').promisify(fs.writeFile)
const readFile = require('util').promisify(fs.readFile)

let dat
let datRes
let key

vorpal
  .command('run [commands...]', 'Run commands when connected to a Dat')
  .action(async function (args, next) {
    // TODO: check if connected before actually running anything
    await writeFile(path.join(DAT_FOLDER, SHELL_FILE), args.commands.join(' '))
    next()
  })

vorpal
  .command('start')
  .action(async function (args, next) {
    // make folders
    await mkdirp(DAT_FOLDER)
    await mkdirp(DAT_RESULTS)
    // TODO: make .datignore only if it doesn't exists
    await writeFile(path.join(DAT_FOLDER, '.datignore'), '.key')
    try {
      key = await readFile(path.join(DAT_FOLDER, '.key'))
    } catch (err) {}

    dat = await Dat(DAT_FOLDER)
    dat.importFiles({ watch: true, ignoreHidden: false })
    dat.joinNetwork()
    this.log('Dat link is: dat://' + dat.key.toString('hex'))

    if (key) {
      datRes = await Dat(DAT_RESULTS, { key })
      datRes.joinNetwork()
    } else {
      await this.prompt({
        type: 'input',
        name: 'key',
        message: 'Enter remote Dat key? '
      }, async function (result) {
        // results dat
        key = result.key
        await writeFile(path.join(DAT_FOLDER, '.key'), key)
        datRes = await Dat(DAT_RESULTS, { key })
        datRes.joinNetwork()
      })
    }
    next()
  })

vorpal.
  command('close', 'Close connection to Dat')
  .action((args, next) => {
    if (dat) dat.leaveNetwork()
    next()
  })

vorpal
  .delimiter('dsh >')
  .show()