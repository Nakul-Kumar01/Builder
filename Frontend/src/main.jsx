// import React from 'react'
import { createRoot } from 'react-dom/client'
import About from './components/About'
import App from './components/app'
import Me from './components/aboutme'
import Footer from './components/footer'
import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {BrowserRouter, Routes,Route, Navigate} from 'react-router';
import Home from './components/Home'
import ActualBuilder from './ActualBuilder'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { checkAuth } from './store/authSlice'
import Login from './pages/login'
import Signup from './pages/sign'
import { StrictMode } from 'react'
import store from './store/store'

function Main(){

  useEffect(() => {     // also in main.jsx // in its function // ek barr pure project me
    AOS.init({
      duration: 1000, // Animation duration in milliseconds
      once: true, // Whether animation should happen only once
    });
  }, []);


  const {isAuthenticated,user} = useSelector((state)=>state.auth);
  const dispatch = useDispatch();

  useEffect(()=>{
    dispatch(checkAuth());
  },[dispatch]);

  

  return(
     <>
       <BrowserRouter>
           <Routes>
              <Route path='/' element={<Home></Home>}></Route>
              <Route path='/builder' element={isAuthenticated ? <ActualBuilder></ActualBuilder> : <Navigate to={"/login"}></Navigate>}></Route>
              <Route path='/login' element={isAuthenticated ? <Navigate to={"/"}></Navigate> : <Login></Login>}></Route>
              <Route path='/signup' element={isAuthenticated ? <Navigate to={"/"}></Navigate> : <Signup></Signup>}></Route>
           </Routes>
       </BrowserRouter>
     </>
  )
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <Main></Main>
    </Provider>
  </StrictMode>
)
