import React from 'react'
import GenericTabs from './GenericTabs.jsx'

export default function MainContentCard() {
  return (
    <main className="app-card main-content-card">
      <div className="app-eyebrow">WORKSPACE</div>
      <h2>Application</h2>
      <p className="card-description">
        Generic two-tab application area. Replace the placeholder content with app-specific components.
      </p>
      <GenericTabs />
    </main>
  )
}
