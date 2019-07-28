const hyperdrive    = require('hyperdrive')
const hypercore     = require('hypercore')
const hyperarchiver = require('hypercore-archiver')
const disc          = require('discovery-swarm')
const swarmDefaults = require('dat-swarm-defaults')
const mirror = require('mirror-folder')
const assert = require('assert')
const debug = require('debug')('dat-node')

function noop() {}

var archive = hyperdrive('./data/drive')

// archive.writeFile('/info.json', JSON.stringify({ msg: 'ok' }), function (err) {
//   if (err) throw err
//   archive.readdir('/', function (err, list) {
//     if (err) throw err
//     console.log(list) // prints ['info.json']
//     archive.readFile('/info.json', 'utf-8', function (err, data) {
//       if (err) throw err
//       console.log(data) // prints 'world'
//     })
//   })
// })


archive.ready(() => {
  console.log(archive.key.toString('hex'))
  console.log(archive.metadata.secretKey.toString('hex'))
  var network = join(archive)
  network.once('connection', function () {
    console.log('Connected')
  })
})


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
