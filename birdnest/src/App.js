import React, { useEffect, useState } from 'react'
import './App.css';

function App() {

  let [ violators, setViolators ] = useState([])

  useEffect(() => {
    let interval = setInterval(() => {
      fetch("/api")
        .then(res => res.json())
        .then(data => {
          setViolators([...data])
        })
    }, 2000);
    return () => clearInterval(interval)
  }, [])

  function renderViolators() {
    return violators.map((item, i) => {
      return (
        <div key={i} className="violator">
          <div className="violator_title">{item.firstName + " " + item.lastName}</div>
          <div className="violator_text">{item.email}</div>
          <div className="violator_text">{item.phoneNumber}</div>
          <div className="violator_text">Closest confirmed distance: {item.distance}m</div>
        </div>
      )
    })
  }

  return (
    <div className="container">

      <div className="title">All recent violators of NDZ</div>

      <div className="violators_container">
        {renderViolators()}
      </div>

    </div>
  );
}

export default App;
