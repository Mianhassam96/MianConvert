import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ActivityItem {
  id: number;
  text: string;
  time: string;
  icon: string;
}

const ACTIVITY_POOL = [
  { text: "Someone compressed a 240MB video", icon: "📦" },
  { text: "TikTok preset applied to a 4K clip", icon: "📱" },
  { text: "18 videos optimized in the last minute", icon: "⚡" },
  { text: "Someone extracted audio from a MOV file", icon: "🎧" },
  { text: "YouTube 1080p export completed in 4.2s", icon: "▶️" },
  { text: "Subtitles burned into a 12-minute video", icon: "💬" },
  { text: "Someone reduced a 1.2GB file to 180MB", icon: "📦" },
  { text: "WhatsApp preset trending right now", icon: "💬" },
  { text: "GIF created from a 30s clip", icon: "🎞" },
  { text: "Thumbnail extracted at 1280×720", icon: "📸" },
  { text: "Auto Optimize saved 68% file size", icon: "⚡" },
  { text: "Someone merged 3 videos seamlessly", icon: "🔗" },
];

let idCounter = 0;
const makeItem = (): ActivityItem => {
  const pool = ACTIVITY_POOL[Math.floor(Math.random() * ACTIVITY_POOL.length)];
  const secs = Math.floor(Math.random() * 55) + 5;
  return { id: ++idCounter, text: pool.text, icon: pool.icon, time: `${secs}s ago` };
};

const TRENDING = [
  { rank: 1, label: "TikTok Ready",   icon: "📱", count: "2.1k" },
  { rank: 2, label: "WhatsApp Small", icon: "💬", count: "1.8k" },
  { rank: 3, label: "YouTube HD",     icon: "▶️", count: "1.4k" },
];

const ActivityFeed = () => {
  const [items, setItems] = useState<ActivityItem[]>(() => [makeItem(), makeItem(), makeItem()]);

  useEffect(() => {
    const id = setInterval(() => {
      setItems(prev => [makeItem(), ...prev.slice(0, 2)]);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {/* Live activity */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Live activity</p>
        </div>
        <div className="space-y-2 overflow-hidden min-h-[72px]">
          <AnimatePresence initial={false}>
            {items.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -16, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300"
              >
                <span className="text-sm shrink-0">{item.icon}</span>
                <span className="flex-1 truncate">{item.text}</span>
                <span className="text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">{item.time}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Trending presets */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🔥</span>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trending presets today</p>
        </div>
        <div className="space-y-2">
          {TRENDING.map((t, i) => (
            <motion.div
              key={t.rank}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              <span className={`text-xs font-black w-5 text-center shrink-0 ${
                t.rank === 1 ? "text-amber-500" : t.rank === 2 ? "text-gray-400" : "text-orange-400"
              }`}>{t.rank}</span>
              <span className="text-sm shrink-0">{t.icon}</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex-1">{t.label}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums shrink-0">{t.count} uses</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityFeed;
