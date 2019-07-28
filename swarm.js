const discovery = require('@hyperswarm/discovery')
const crypto = require('crypto')

const d = discovery()
const key = sha(Buffer.from('abcde'))

function sha(data) {
  const hash = crypto.createHash('sha256')
  hash.update(data, Buffer.isBuffer(data) ? null : 'utf8')
  return hash.digest()
}

console.log(key)

const hyperswarm = require('hyperswarm')

const swarm = hyperswarm()

// look for peers listed under this topic
const topic = crypto.createHash('sha256')
  .update('my-hyperswarm-topic')
  .digest()

swarm.join(topic, {
  lookup: true, // find & connect to peers
  announce: true // optional- announce self as a connection target
})

swarm.on('connection', (socket, details) => {
  console.log('new connection!', details)

  // you can now use the socket as a stream, eg:
  // process.stdin.pipe(socket).pipe(process.stdout)
})

