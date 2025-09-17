import React from 'react'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Admin from './pages/adminPage'


const App = () => {
  return (
   <BrowserRouter>
      <div>
        <Toaster position='top-right'/>

        <Routes>
           
           <Route path="/admin" element={<Admin></Admin>}></Route>
          

        </Routes>
      </div>

   </BrowserRouter>
  )
}

export default App