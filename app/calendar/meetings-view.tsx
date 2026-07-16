"use client";

import { useEffect, useState } from "react";
import type { AnnualMeetingsData } from "../site-data";
import { Tabs } from "../ui/tabs";
import { CalendarView } from "./calendar-view";
import { ListView } from "./list-view";
import { todayInTokyo } from "./meetings-lib";
import styles from "./meetings-view.module.css";

const tabItems = [
  { id: "calendar", label: "カレンダー" },
  { id: "list", label: "リスト" }
];

type MeetingsViewProps = {
  data: AnnualMeetingsData;
  /** SSR時点の「今日」（Asia/Tokyo, YYYY-MM-DD）。マウント後に端末側で再計算する */
  initialToday: string;
};

export function MeetingsView({ data, initialToday }: MeetingsViewProps) {
  const [activeTab, setActiveTab] = useState("list");
  const [today, setToday] = useState(initialToday);

  useEffect(() => {
    setToday(todayInTokyo());
  }, []);

  return (
    <div className={styles.view}>
      <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} label="学会情報の表示切り替え" />
      <div
        className={styles.panel}
        role="tabpanel"
        aria-label="学会カレンダー"
        hidden={activeTab !== "calendar"}
      >
        <CalendarView data={data} today={today} />
      </div>
      <div className={styles.panel} role="tabpanel" aria-label="学会リスト" hidden={activeTab !== "list"}>
        <ListView data={data} today={today} />
      </div>
    </div>
  );
}
