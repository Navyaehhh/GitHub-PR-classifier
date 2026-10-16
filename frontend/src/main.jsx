import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
function Github() {
  let id = document.getElementById("GitHub-Link").value;
  if (id == "") {
    alert("Please enter your name");
    return false;
  }
}
