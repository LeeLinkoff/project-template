import React from 'react'
import AppHeaderCard from './components/AppHeaderCard.jsx'
import BackendHealthCard from './components/BackendHealthCard.jsx'
import MainContentCard from './components/MainContentCard.jsx'
import './App.css'

const APP = {
  title: 'Application Name',
  description: 'Reusable React application template with a backend health check and generic tabbed workspace.',
}

export default function App() {
  return (
    <div className="app-shell">
      <AppHeaderCard title={APP.title} description={APP.description} />
      <BackendHealthCard />
      <MainContentCard />
    </div>
  )
}
