import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Remplace 'metze-finance-app' par le nom exact de ton repo GitHub
export default defineConfig({
  plugins: [react()],
  base: '/Metze-finance-app/',
})
