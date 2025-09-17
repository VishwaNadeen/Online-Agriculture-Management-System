import React from 'react'
import Appointment from './components/appointment'
import { BrowserRouter, Route, Routes } from "react-router-dom";


const App = () => {
  return (
    <BrowserRouter>
     <div className=' w-full flex justify-center items-center'>

      <Routes>

        <Route path="/appoinment" element={<Appointment/>}></Route>

      </Routes>
      
    </div></BrowserRouter>
   
  )
}

export default App

