const path = require('path')
const hyperdb = require('hyperdb')
const hypergraph = require('hyper-graph-db')

const store = hyperdb('graph.db')
const graph = hypergraph(store)

store.on('ready', (err) => {
  if (err) throw err
  findTitle('Seeing like a feminist', (err) => {
    findBooksByAuthor('Gayatri Chakravorty Spivak', (err) => {
      console.log('DONE')
    })
  })
})

function readAllLibrary (cb) {
  console.log('starting to read')
  let count = 0
  const searchStream = graph.searchStream([
    { subject: 'library', 'predicate': 'has', object: graph.v('book') },
    { subject: graph.v('book'), 'predicate': 'dc:title', object: graph.v('title') },
    { subject: graph.v('book'), 'predicate': 'dc:author', object: graph.v('author') }
  ])
  searchStream.on('data', (data) => {
    console.log('results:', data)
    count++
  })
  searchStream.on('err', cb)
  searchStream.on('finish', () => {
    console.log('done! Found ', count)
    cb()
  })
}

function findTitle (title, cb) {
  console.log('starting to read')
  let count = 0
  const searchStream = graph.searchStream([
    { subject: graph.v('book'), 'predicate': 'dc:title', object: title }
  ])
  searchStream.on('data', (data) => {
    console.log('results:', data)
    count++
  })
  searchStream.on('err', cb)
  searchStream.on('finish', () => {
    console.log('done! Found ', count)
    cb()
  })
}

function findBooksByAuthor (author) {
  console.log('starting to read')
  let count = 0
  const searchStream = graph.searchStream([
    { subject: graph.v('book'), 'predicate': 'dc:author', object: author },
    { subject: graph.v('book'), 'predicate': 'dc:title', object: graph.v('title') },
    { subject: graph.v('book'), 'predicate': 'dc:title', object: graph.v('author') }
  ])
  searchStream.on('data', (data) => {
    console.log('results:', data)
    count++
  })
  searchStream.on('err', (error) => {
    throw error
  })
  searchStream.on('finish', () => {
    console.log('done! Found ', count)
  })
}
