const hyperdrive    = require('hyperdrive')
const hypercore     = require('hypercore')
const hyperarchiver = require('hypercore-archiver')
const disc          = require('discovery-swarm')
const swarmDefaults = require('dat-swarm-defaults')
const mirror = require('mirror-folder')
const assert = require('assert')
const debug = require('debug')('dat-node')
const fs = require('fs')
const path = require('path')

function noop() {}

function create(archive, opts, cb) {
  assert.ok(archive, 'dat-node: lib/network archive required')
  assert.ok(opts, 'dat-node: lib/network opts required')

  var DEFAULT_PORT = 3282
  var swarmOpts = Object.assign({
    hash: false,
    stream: opts.stream
  }, opts)
  var swarm = disc(swarmDefaults(swarmOpts))
  swarm.once('error', function () {
    swarm.listen(0)
  })
  swarm.listen(opts.port || DEFAULT_PORT)
  swarm.join(archive.discoveryKey, { announce: !(opts.upload === false) }, cb)
  swarm.options = swarm._options
  return swarm
}


function join (archive, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  opts = opts || {}
  cb = cb || noop

  var netOpts = Object.assign({}, {
    stream: function (peer) {
      var stream = archive.replicate({
        upload: !(opts.upload === false),
        download: !archive.writable && opts.download,
        live: !opts.end
      })
      stream.on('close', function () {
        debug('Stream close')
      })
      stream.on('error', function (err) {
        debug('Replication error:', err.message)
      })
      stream.on('end', function () {
        archive.downloaded = true
        debug('Replication stream ended')
      })
      return stream
    }
  }, opts)

  return create(archive, netOpts, cb)
}


var key = '4725d2e8f2bd8761c8608b7d4a53e5e9aa05610289f6ae7c7a352cdea6b8cbb6'
var archive = hyperdrive('./data/cloned', key)

archive.ready(() => {
  console.log(archive.key.toString('hex'))
  var network = join(archive)
  network.once('connection', function () {
    console.log('Connected')
  })
  // archive.metadata.update(download)
  download()

  function download () {
    archive.readFile('/info.json', 'utf8', console.log)
  }
})
