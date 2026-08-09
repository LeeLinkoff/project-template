import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'

export default function GenericTabs() {
  return (
    <Tabs.Root defaultValue="tab-one" className="generic-tabs-root">
      <Tabs.List className="generic-tabs-list" aria-label="Application sections">
        <Tabs.Trigger value="tab-one" className="generic-tabs-trigger">
          Tab One
        </Tabs.Trigger>
        <Tabs.Trigger value="tab-two" className="generic-tabs-trigger">
          Tab Two
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="tab-one" className="generic-tabs-content">
        <div className="placeholder-panel">
          <h3>Tab One Content</h3>
          <p>Replace this placeholder with the first application feature or workflow.</p>
        </div>
      </Tabs.Content>

      <Tabs.Content value="tab-two" className="generic-tabs-content">
        <div className="placeholder-panel">
          <h3>Tab Two Content</h3>
          <p>Replace this placeholder with the second application feature or workflow.</p>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  )
}
