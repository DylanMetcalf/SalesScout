"use client";

import { useState, type ReactNode } from "react";
import { Tabs, TabPanel } from "@/components/ui/tabs";

/** Tabs whose panels are rendered on the server and passed in. */
export function OpportunityTabs({ tabs, initial }: { tabs: { id: string; label: string; content: ReactNode }[]; initial?: string }) {
  const [tab, setTab] = useState(tabs.some((t) => t.id === initial) ? initial! : tabs[0].id);
  return (
    <div>
      <Tabs
        label="Opportunity sections"
        tabs={tabs.map(({ id, label }) => ({ id, label }))}
        value={tab}
        onChange={(id) => {
          setTab(id);
          history.replaceState(null, "", `?tab=${id}`);
        }}
      />
      {tabs.map((t) => (
        <TabPanel key={t.id} id={t.id} active={tab === t.id} className="pt-6">
          {t.content}
        </TabPanel>
      ))}
    </div>
  );
}
