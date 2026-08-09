import React from 'react'

export default function AppHeaderCard({
  title = 'Application Name',
  description = 'Short application description goes here.',
}) {
  return (
    <header className="app-card app-header-card">
      <div className="app-eyebrow">APPLICATION</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  )
}
