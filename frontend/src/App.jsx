import React from 'react'
import Appointment from './components/appointment'
import { BrowserRouter, Route, Routes } from "react-router-dom";

const App = () => {
  return (
    
  <BrowserRouter>
    <div>
      <Routes>

        <Route path="/appoinment" element={<Appointment/>}></Route>

      </Routes>
    </div>
  </BrowserRouter>
   
  )
}

export default App