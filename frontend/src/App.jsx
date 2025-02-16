import { useState } from 'react'
import AppRouter from './config/Router'
import AdminElection from './admin/AdminElection'


function App() {

  return (
    <>
      <AppRouter />
      <AdminElection />
    </>
  )
}

export default App
