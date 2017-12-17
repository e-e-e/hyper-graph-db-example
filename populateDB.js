const path = require('path')
const hyperdb = require('hyperdb')
const hypergraph = require('hyper-graph-db')
const walker = require('folder-walker')
const pump = require('pump')
const Writable = require('stream').Writable
const readOPF = require('open-packaging-format').readOPF

const store = hyperdb('graph.db')
const graph = hypergraph(store)

const promisedPut = (triple) => new Promise((resolve, reject) => {
  graph.put(triple, (err, res) => {
    if (err) return reject(err)
    resolve(res)
  })
})

function processMetadata (chunk, encoding, done) {
  console.log(done)
  if (chunk.basename !== 'metadata.opf' || chunk.type !== 'file') return done()
  readOPF(chunk.filepath)
    .then((opf) => {
      console.log(opf.authors)
      const bookId = path.join('book', chunk.relname)
      const authors = opf.authors.map(v => {
        return promisedPut({
          subject: bookId,
          predicate: 'dc:author',
          object: v.value
        })
      })
      return Promise.all([
        promisedPut({ subject: 'library', predicate: 'has', object: bookId }),
        promisedPut({ subject: bookId, predicate: 'dc:title', object: opf.title }),
        ...authors
      ]).then(() => done())
    })
    .catch(() => done())
}

store.on('ready', (err) => {
  if (err) throw err
  const fileStream = walker('./calibreLibrary/')
  const grapher = new Writable({
    objectMode: true,
    write: processMetadata
  })
  pump(fileStream, grapher, (err) => {
    if (err) throw err
  })
})
