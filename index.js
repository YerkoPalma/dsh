#!/usr/bin/env node

const vorpal = require('vorpal')()
const Dat = require('util').promisify(require('dat-node'))
const SHELL_FILE = '.dshell'
const DAT_FOLDER = '.dat-rpc'
const DAT_RESULTS = '.dat-res'
const path = require('path')
const writeFile = require('util').promisify(require('fs').writeFile)
let dat

vorpal
  .command('run [commands...]', 'Run commands when connected to a Dat')
  .action(async function (args, next) {
    await writeFile(path.join(DAT_FOLDER, SHELL_FILE), args.commands.join(' '))
    next()
  })

vorpal
  .command('start')
  .action(async function (args, next) {
    dat = await Dat(DAT_FOLDER)
    dat.importFiles({ watch: true, ignoreHidden: false })
    dat.joinNetwork()
    this.log('Dat link is: dat://' + dat.key.toString('hex'))

    await this.prompt({
      type: 'input',
      name: 'key',
      message: 'Enter remote Dat key? '
    }, async function (result) {
      // results dat
      const key = result.key
      const datIn = await Dat(DAT_RESULTS, { key })
      datIn.joinNetwork()
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
  .delimiter('drpc >')
  .show()