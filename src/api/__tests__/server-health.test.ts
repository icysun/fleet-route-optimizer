import '../server'
import http, { IncomingMessage } from 'http'

describe('API server health endpoint', () => {
  it('responds with 200 on /health', async () => {
    const port = parseInt(process.env.API_PORT || '3001')
    const res = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = http.request({ hostname: 'localhost', port, path: '/health', method: 'GET' }, (resp: IncomingMessage) => {
        let data = ''
        resp.on('data', (chunk: any) => { data += chunk })
        resp.on('end', () => resolve({ status: resp.statusCode || 0, body: data }))
      })
      req.on('error', reject)
      req.end()
    })
    expect(res.status).toBe(200)
  })
})
