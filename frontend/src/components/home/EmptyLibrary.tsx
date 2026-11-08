import { motion } from 'framer-motion';
import { ArrowUpRight, AudioLines, Link2, Send } from 'lucide-react';
import { telegramBotUrl } from '@/lib/env';

const steps = [
  {
    icon: Send,
    title: 'Open MUSE Bot',
    body: 'Your private Telegram bot is the only way music enters this library.',
  },
  {
    icon: Link2,
    title: 'Send a link or a file',
    body: 'A SoundCloud track link, or an MP3, FLAC, WAV, M4A or OGG file.',
  },
  {
    icon: AudioLines,
    title: 'It appears here',
    body: 'MUSE reads the metadata, stores what is allowed, and syncs instantly.',
  },
];

export function EmptyLibrary() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[30px] border border-white/[0.07] bg-white/[0.018] px-6 py-14 sm:px-10 sm:py-16 lg:px-14"
    >
      <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-accent/[0.045] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/[0.025] blur-3xl" />

      <div className="relative max-w-2xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-accent">
          Your library is waiting
        </p>
        <h2 className="mt-4 text-balance font-display text-[34px] font-medium leading-[1.03] tracking-[-0.05em] text-bone-50 sm:text-[46px]">
          A quiet home for the music you keep.
        </h2>
        <p className="mt-4 max-w-lg text-[13.5px] leading-relaxed text-bone-400">
          Nothing here is borrowed from a catalogue. Every track is something you chose — sent
          through Telegram, stored privately, and arranged exactly how you like it.
        </p>
      </div>

      <div className="relative mt-10 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.08, duration: 0.5 }}
              className="rounded-2xl border border-white/[0.07] bg-ink-900/40 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-accent">
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <span className="font-display text-[11px] tabular-nums text-bone-600">
                  0{index + 1}
                </span>
              </div>
              <p className="mt-4 text-[13px] font-medium text-bone-100">{step.title}</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-bone-500">{step.body}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="relative mt-9 flex flex-wrap items-center gap-4">
        <a
          href={telegramBotUrl}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex h-11 items-center gap-2.5 rounded-full bg-bone-100 px-5 text-[13px] font-medium text-ink-950 transition-all duration-300 hover:bg-white active:scale-[0.98]"
        >
          <Send className="h-4 w-4" />
          Open MUSE Bot
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
        <p className="text-[11px] text-bone-600">
          Private by design · only your Telegram ID can add music
        </p>
      </div>
    </motion.section>
  );
}
