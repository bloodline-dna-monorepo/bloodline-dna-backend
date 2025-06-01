import express from 'express'
import { console } from 'inspector'
import { config } from './config'
const app = express()

app.listen(config.port, () => {
  console.log('Server đang chạy trên 3000')
})

app.get('/', (req, res) => {
  console.log('<h1>SIUUU<h1/>')
})
