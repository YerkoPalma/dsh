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
const unlink = require('util').promisify(fs.unlink)

let dat
let datRes
let key
let stdout
let stderr

vorpal
  .command('run [commands...]', 'Run commands when connected to a Dat')
  .action(async function (args, next) {
    // TODO: check if connected before actually running anything
    await writeFile(path.join(DAT_FOLDER, SHELL_FILE), args.commands.join(' '))
    next()
  })

vorpal
  .command('start')
  .option('-q, --quiet')
  .action(async function (args, next) {
    // make folders
    await mkdirp(DAT_FOLDER)
    await mkdirp(DAT_RESULTS)
    try {
      await unlink(path.join(DAT_FOLDER, SHELL_FILE))
    } catch (e) {}

    // TODO: make .datignore only if it doesn't exists
    await writeFile(path.join(DAT_FOLDER, '.datignore'), '.key')
    try {
      key = await readFile(path.join(DAT_FOLDER, '.key'))
    } catch (err) {}

    dat = await Dat(DAT_FOLDER)
    dat.importFiles({ watch: true, ignoreHidden: false })
    dat.joinNetwork()
    if (!args.options.quiet) this.log('Dat link is: dat://' + dat.key.toString('hex'))

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
    fs.watchFile(DAT_RESULTS, async (current, previous) => {
      try {
        stdout = await readFile(path.join(DAT_RESULTS, '.stdout'), 'utf8')
        stderr = await readFile(path.join(DAT_RESULTS, '.stderr'), 'utf8')  
      } catch (e) {}

      if (stdout) this.log(stdout)
      if (stderr) this.log(stderr)
    })
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