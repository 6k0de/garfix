import dotenv from 'dotenv'
import app from './app.ts'

dotenv.config()

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
