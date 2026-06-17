import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import { usePomodoroTimer } from './hooks/usePomodoroTimer'
import { burstAtElement, playUiClick } from './lib/feedback'
import {
  type MicroTask,
  type RecurrenceType,
  type RecurringTaskTemplate,
  usePomodoroStore,
} from './store/usePomodoroStore'

type AppView = 'sprint' | 'routines'

const springConfig: Transition = {
  type: 'spring',
  stiffness: 390,
  damping: 26,
  mass: 0.75,
}

const getDopexScore = (task: MicroTask) => task.funScore * 1.25 + task.durationScore * 1.45

const getDopexTier = (task: MicroTask) => {
  if (task.funScore >= 4 && task.durationScore >= 4) {
    return { label: 'Dopamin-Zone', tone: 'bg-emerald-500/18 text-emerald-100' }
  }

  if (task.funScore >= 4 && task.durationScore <= 3) {
    return { label: 'Flow, aber längere Dauer', tone: 'bg-sky-500/18 text-sky-100' }
  }

  if (task.funScore <= 3 && task.durationScore >= 4) {
    return { label: 'Kurz & knackig', tone: 'bg-amber-400/25 text-amber-100' }
  }

  return { label: 'Pflichtblock', tone: 'bg-slate-400/22 text-slate-100' }
}

const recurrenceLabel: Record<RecurrenceType, string> = {
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
}

const wallCardThemes = [
  {
    accent: 'from-amber-300/35 via-rose-300/18 to-transparent',
    badge: 'bg-amber-200/75 text-amber-950',
    label: 'Schneller Schritt',
  },
  {
    accent: 'from-sky-300/30 via-cyan-300/18 to-transparent',
    badge: 'bg-sky-200/75 text-sky-950',
    label: 'Guter Fluss',
  },
  {
    accent: 'from-emerald-300/34 via-lime-300/14 to-transparent',
    badge: 'bg-emerald-200/75 text-emerald-950',
    label: 'Dranbleiben',
  },
  {
    accent: 'from-fuchsia-300/28 via-pink-300/16 to-transparent',
    badge: 'bg-fuchsia-200/75 text-fuchsia-950',
    label: 'Kleiner Fortschritt',
  },
] as const

const getWallCardTheme = (index: number) => wallCardThemes[index % wallCardThemes.length]

const formatDueTimes = (dueTimes: string[]) => dueTimes.join(' · ')

const formatTaskDuration = (durationMs?: number) => {
  if (!durationMs) {
    return 'gerade eben'
  }

  const totalMinutes = Math.max(1, Math.round(durationMs / 60000))
  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}

const getSpeedMedal = (durationMs?: number) => {
  if (!durationMs) {
    return { label: 'Gerade erledigt', tone: 'bg-white/50 text-[color:var(--accent)]' }
  }

  if (durationMs <= 5 * 60 * 1000) {
    return { label: 'unter 5 min', tone: 'bg-amber-200/75 text-amber-950' }
  }

  if (durationMs <= 15 * 60 * 1000) {
    return { label: 'unter 15 min', tone: 'bg-emerald-200/75 text-emerald-950' }
  }

  return { label: 'laenger dran', tone: 'bg-sky-200/75 text-sky-950' }
}

const getWallAchievement = (task: MicroTask) => {
  if ((task.durationMs ?? Infinity) <= 10 * 60 * 1000) {
    return 'Schnell abgeschlossen'
  }

  if (task.funScore >= 4 && task.durationScore >= 4) {
    return 'Passt sehr gut'
  }

  if (task.durationScore >= 4) {
    return 'Klarer Abschluss'
  }

  if (task.funScore >= 4) {
    return 'Gutes Gefuehl'
  }

  return 'Solider Fortschritt'
}

const formatDurationScore = (score: number) => {
  if (score >= 5) {
    return 'Dauer: sehr kurz'
  }

  if (score >= 4) {
    return 'Dauer: kurz'
  }

  if (score >= 3) {
    return 'Dauer: mittel'
  }

  if (score >= 2) {
    return 'Dauer: eher lang'
  }

  return 'Dauer: lang'
}

const formatFunScore = (score: number) => {
  if (score >= 5) {
    return 'Spass: macht richtig Spass'
  }

  if (score >= 4) {
    return 'Spass: macht Spass'
  }

  if (score >= 3) {
    return 'Spass: okay'
  }

  if (score >= 2) {
    return 'Spass: eher zäh'
  }

  return 'Spass: kein Spass'
}

const formatDueStatus = (template: RecurringTaskTemplate) => {
  const diffMs = template.nextDueAt - Date.now()
  if (diffMs <= 0) {
    return { text: 'Jetzt fällig', urgent: true }
  }

  const hours = Math.round(diffMs / (1000 * 60 * 60))
  if (hours < 24) {
    return { text: `In ${hours}h fällig`, urgent: false }
  }

  const days = Math.round(hours / 24)
  return { text: `In ${days}d fällig`, urgent: false }
}

function TimerRing({ percent, label, time }: { percent: number; label: string; time: string }) {
  const radius = 110
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - percent)

  return (
    <div className="relative mx-auto grid h-64 w-64 place-items-center">
      <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 260 260" aria-hidden="true">
        <circle cx="130" cy="130" r={radius} stroke="currentColor" strokeOpacity="0.15" strokeWidth="12" fill="none" />
        <motion.circle
          cx="130"
          cy="130"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          initial={false}
          animate={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }}
          transition={springConfig}
          style={{ color: 'var(--accent)' }}
        />
      </svg>
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--text-soft)]">{label}</p>
        <motion.p key={time} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="app-title mt-2 text-5xl font-semibold tracking-tight text-[color:var(--text-main)]">
          {time}
        </motion.p>
      </div>
    </div>
  )
}

function TaskChip({
  task,
  rank,
  onComplete,
}: {
  task: MicroTask
  rank: number
  onComplete: (task: MicroTask, target: HTMLElement) => void
}) {
  const tier = getDopexTier(task)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={
        task.completed
          ? {
              opacity: 0,
              y: -18,
              scale: [1, 1.04, 0.97],
              boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 24px var(--glow)', '0 0 0 rgba(0,0,0,0)'],
            }
          : { opacity: 1, y: 0, scale: 1 }
      }
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={task.completed ? { duration: 0.58 } : springConfig}
      className="relative flex items-center gap-3 rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--card-strong)] px-4 py-3"
    >
      <div className="grid h-7 w-7 place-items-center rounded-full border border-[color:var(--stroke)] text-xs font-semibold text-[color:var(--text-soft)]">
        {rank}
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        className="grid h-7 w-7 place-items-center rounded-full border border-[color:var(--stroke)] bg-[color:var(--accent-soft)]"
        onClick={(event) => onComplete(task, event.currentTarget)}
        aria-label={`${task.text} abschliessen`}
      >
        <motion.span
          animate={task.completed ? { scale: [0.7, 1.2, 1], opacity: 1 } : { scale: 0.6, opacity: 0.25 }}
          transition={springConfig}
          className="block h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]"
        />
      </motion.button>

      <div className="relative flex-1 overflow-hidden">
        <motion.span
          animate={task.completed ? { opacity: 0.66, y: -1 } : { opacity: 1, y: 0 }}
          transition={springConfig}
          className="block text-left text-base text-[color:var(--text-main)]"
        >
          {task.text}
        </motion.span>
        <motion.span
          aria-hidden="true"
          className="absolute left-0 top-1/2 block h-px w-full origin-left bg-[color:var(--accent)]"
          initial={false}
          animate={{ scaleX: task.completed ? 1 : 0, opacity: task.completed ? 1 : 0 }}
          transition={springConfig}
        />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.15em] ${tier.tone}`}>{tier.label}</span>
          <span className="text-xs text-[color:var(--text-soft)]">{formatFunScore(task.funScore)}</span>
          <span className="text-xs text-[color:var(--text-soft)]">{formatDurationScore(task.durationScore)}</span>
          <span className="text-xs font-semibold text-[color:var(--accent)]">Dopex {getDopexScore(task).toFixed(1)}</span>
        </div>
      </div>
    </motion.li>
  )
}

function App() {
  const [activeView, setActiveView] = useState<AppView>('sprint')
  const [wallPreviewOpen, setWallPreviewOpen] = useState(false)
  const [draftTask, setDraftTask] = useState('')
  const [draftFunScore, setDraftFunScore] = useState(4)
  const [draftDurationScore, setDraftDurationScore] = useState(4)
  const [routineComposerOpen, setRoutineComposerOpen] = useState(false)
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)
  const [recurringTitle, setRecurringTitle] = useState('')
  const [recurringCadence, setRecurringCadence] = useState<RecurrenceType>('daily')
  const [recurringDueTimes, setRecurringDueTimes] = useState('08:00, 12:00, 15:00')
  const [recurringFunScore, setRecurringFunScore] = useState(3)
  const [recurringDurationScore, setRecurringDurationScore] = useState(4)
  const {
    phase,
    sprintStarted,
    isRunning,
    tasks,
    recurringTemplates,
    completedThisSprint,
    addTask,
    addRecurringTemplate,
    updateRecurringTemplate,
    deleteRecurringTemplate,
    loadRecurringTaskToSprint,
    completeTask,
    archiveTask,
    startSprint,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    startNextSprint,
  } = usePomodoroStore()
  const { displayTime, totalDisplayTime, progressPercent } = usePomodoroTimer()

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const scoreDiff = getDopexScore(b) - getDopexScore(a)
        if (scoreDiff !== 0) {
          return scoreDiff
        }

        const durationDiff = b.durationScore - a.durationScore
        if (durationDiff !== 0) {
          return durationDiff
        }

        return b.funScore - a.funScore
      }),
    [tasks],
  )

  const recurringByUrgency = useMemo(
    () =>
      [...recurringTemplates].sort((a, b) => {
        if (a.nextDueAt !== b.nextDueAt) {
          return a.nextDueAt - b.nextDueAt
        }

        return b.durationScore - a.durationScore
      }),
    [recurringTemplates],
  )

  const suggestedRecurring = useMemo(() => {
    const now = Date.now()

    return recurringByUrgency
      .filter((template) => template.nextDueAt <= now)
      .filter(
        (template) => !tasks.some((task) => task.sourceTemplateId === template.id && !task.completed),
      )
      .slice(0, 3)
  }, [recurringByUrgency, tasks])
  const dueRecurringCount = suggestedRecurring.length
  const showBreakView = phase === 'break' || wallPreviewOpen
  const wallPreviewTasks = useMemo(() => {
    if (completedThisSprint.length > 0) {
      return completedThisSprint
    }

    return sortedTasks.slice(0, 4).map((task) => ({
      ...task,
      completed: true,
    }))
  }, [completedThisSprint, sortedTasks])

  const topTask = sortedTasks[0]

  const canStart = tasks.length >= 3 && tasks.length <= 5
  const timerButtonLabel = sprintStarted ? 'Fokus-Timer starten' : 'Timer solo'
  const taskLabel = useMemo(() => {
    if (tasks.length < 3) return 'Lade mindestens 3 Mikro-Tasks in den Sprint'
    if (tasks.length > 5) return 'Maximal 5 Mikro-Tasks pro Sprint'
    return 'Sprint vorbereitet'
  }, [tasks.length])

  const handleAddTask = () => {
    const value = draftTask.trim()
    if (!value) return
    if (tasks.length >= 5) return
    addTask(value, draftFunScore, draftDurationScore)
    playUiClick(720)
    setDraftTask('')
  }

  const handleCreateRecurring = () => {
    const value = recurringTitle.trim()
    if (!value) return

    const parsedDueTimes = recurringDueTimes
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (editingRoutineId) {
      updateRecurringTemplate(
        editingRoutineId,
        value,
        recurringCadence,
        parsedDueTimes,
        recurringFunScore,
        recurringDurationScore,
      )
    } else {
      addRecurringTemplate(
        value,
        recurringCadence,
        parsedDueTimes,
        recurringFunScore,
        recurringDurationScore,
      )
    }

    playUiClick(680)
    setRecurringTitle('')
    setRecurringDueTimes('08:00, 12:00, 15:00')
    setEditingRoutineId(null)
    setRoutineComposerOpen(false)
  }

  const handleEditRecurring = (template: RecurringTaskTemplate) => {
    setEditingRoutineId(template.id)
    setRecurringTitle(template.title)
    setRecurringCadence(template.recurrence)
    setRecurringDueTimes(template.dueTimes.join(', '))
    setRecurringFunScore(template.funScore)
    setRecurringDurationScore(template.durationScore)
    setRoutineComposerOpen(true)
    playUiClick(600)
  }

  const handleDeleteRecurring = (templateId: string) => {
    deleteRecurringTemplate(templateId)
    if (editingRoutineId === templateId) {
      setEditingRoutineId(null)
      setRecurringTitle('')
      setRecurringCadence('daily')
      setRecurringDueTimes('08:00, 12:00, 15:00')
      setRecurringFunScore(3)
      setRecurringDurationScore(4)
      setRoutineComposerOpen(false)
    }
    playUiClick(460)
  }

  const handleCancelRecurringEdit = () => {
    setEditingRoutineId(null)
    setRecurringTitle('')
    setRecurringCadence('daily')
    setRecurringDueTimes('08:00, 12:00, 15:00')
    setRecurringFunScore(3)
    setRecurringDurationScore(4)
    setRoutineComposerOpen(false)
  }

  const handleLoadRecurring = (templateId: string) => {
    loadRecurringTaskToSprint(templateId)
    playUiClick(640)
  }

  const handleLoadSuggestedRecurring = () => {
    if (suggestedRecurring.length === 0 || tasks.length >= 5) {
      return
    }

    const freeSlots = 5 - tasks.length
    const toLoad = suggestedRecurring.slice(0, freeSlots)
    for (const template of toLoad) {
      loadRecurringTaskToSprint(template.id)
    }

    playUiClick(700)
  }

  const handleComplete = (task: MicroTask, target: HTMLElement) => {
    if (task.completed) return
    completeTask(task.id)
    playUiClick(980)
    burstAtElement(target)

    window.setTimeout(() => archiveTask(task.id), 620)
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-2 py-4 sm:px-6 sm:py-10">
      <section className="app-shell grain relative overflow-hidden p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">Dopex Matrix Sprint</p>
            <h1 className="app-title mt-1 text-3xl font-semibold text-[color:var(--text-main)] sm:text-4xl">Pomodoro Dopamine Loop</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-[color:var(--stroke)] bg-[color:var(--card-strong)] p-1">
              <button
                type="button"
                onClick={() => setActiveView('sprint')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeView === 'sprint'
                    ? 'bg-[color:var(--accent)] text-white'
                    : 'text-[color:var(--text-soft)] hover:bg-black/5'
                }`}
              >
                Sprint
              </button>
              <button
                type="button"
                onClick={() => setActiveView('routines')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeView === 'routines'
                    ? 'bg-[color:var(--accent)] text-white'
                    : 'text-[color:var(--text-soft)] hover:bg-black/5'
                }`}
              >
                Routinen
              </button>
            </div>

            <div className="rounded-full border border-[color:var(--stroke)] bg-[color:var(--card-strong)] px-4 py-2 text-sm text-[color:var(--text-soft)]">
              {showBreakView ? (wallPreviewOpen ? 'Wall Preview' : 'Break Phase') : 'Focus Phase'}
            </div>
          </div>
        </div>

        {phase === 'focus' && activeView === 'sprint' && dueRecurringCount > 0 ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--stroke)] bg-[color:var(--card-strong)] px-3 py-1.5 text-xs text-[color:var(--text-soft)]">
            <span>{dueRecurringCount} Routinen sind fällig</span>
            <button
              type="button"
              onClick={() => setActiveView('routines')}
              className="rounded-full bg-[color:var(--accent-soft)] px-2 py-1 font-semibold text-[color:var(--accent)]"
            >
              Öffnen
            </button>
          </div>
        ) : null}

        {activeView === 'routines' ? (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springConfig}
            className="mt-6 rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--card-strong)] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="app-title text-lg font-semibold text-[color:var(--text-main)]">Routinen</h2>
                <p className="mt-1 text-sm text-[color:var(--text-soft)]">
                  Wiederkehrende Aufgaben bleiben separat und nur bei Fälligkeit relevant.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                  {recurringTemplates.length} aktiv
                </span>
                <button
                  type="button"
                  onClick={() => setRoutineComposerOpen((open) => !open)}
                  className="rounded-full border border-[color:var(--stroke)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-main)]"
                >
                  {routineComposerOpen ? 'Schließen' : 'Neue Routine'}
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {routineComposerOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={springConfig}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-[color:var(--stroke)] bg-black/3 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-soft)]">
                        {editingRoutineId ? 'Routine bearbeiten' : 'Neue Routine anlegen'}
                      </p>
                      {editingRoutineId ? (
                        <button
                          type="button"
                          onClick={handleCancelRecurringEdit}
                          className="rounded-full border border-[color:var(--stroke)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--text-main)]"
                        >
                          Abbrechen
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input
                        value={recurringTitle}
                        onChange={(event) => setRecurringTitle(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleCreateRecurring()
                        }}
                        placeholder="z.B. E-Mails bearbeiten"
                        className="w-full rounded-xl border border-[color:var(--stroke)] bg-transparent px-3 py-2 text-base text-[color:var(--text-main)] outline-none placeholder:text-[color:var(--text-soft)] focus:border-[color:var(--accent)]"
                      />

                      <select
                        value={recurringCadence}
                        onChange={(event) => setRecurringCadence(event.target.value as RecurrenceType)}
                        className="rounded-xl border border-[color:var(--stroke)] bg-transparent px-3 py-2 text-sm text-[color:var(--text-main)]"
                      >
                        <option value="daily">Täglich</option>
                        <option value="weekly">Wöchentlich</option>
                        <option value="monthly">Monatlich</option>
                      </select>
                    </div>

                    <input
                      value={recurringDueTimes}
                      onChange={(event) => setRecurringDueTimes(event.target.value)}
                      placeholder="08:00, 12:00, 15:00"
                      className="mt-2 w-full rounded-xl border border-[color:var(--stroke)] bg-transparent px-3 py-2 text-sm text-[color:var(--text-main)] outline-none placeholder:text-[color:var(--text-soft)] focus:border-[color:var(--accent)]"
                    />
                    <p className="mt-1 text-xs text-[color:var(--text-soft)]">
                      Mehrere Uhrzeiten mit Komma trennen, z. B. 08:00, 12:00, 15:00.
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-[color:var(--text-soft)]">Spass</span>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={recurringFunScore}
                          onChange={(event) => setRecurringFunScore(Number(event.target.value))}
                          className="w-full accent-[color:var(--accent)]"
                        />
                        <span className="text-xs text-[color:var(--text-soft)]">{recurringFunScore}/5</span>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-[color:var(--text-soft)]">Dauer</span>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={recurringDurationScore}
                          onChange={(event) => setRecurringDurationScore(Number(event.target.value))}
                          className="w-full accent-[color:var(--accent)]"
                        />
                        <span className="text-xs text-[color:var(--text-soft)]">1 = lang, 5 = kurz · {recurringDurationScore}/5</span>
                      </label>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleCreateRecurring}
                        className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                      >
                        {editingRoutineId ? 'Routine speichern' : 'Routine anlegen'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-soft)]">
                {dueRecurringCount > 0 ? `${dueRecurringCount} fällig` : 'Keine fälligen Routinen'}
              </p>
              <button
                type="button"
                onClick={handleLoadSuggestedRecurring}
                disabled={dueRecurringCount === 0 || tasks.length >= 5}
                className="rounded-full border border-[color:var(--stroke)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-main)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Fällige laden
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {recurringByUrgency.map((template) => {
                const due = formatDueStatus(template)
                const alreadyInSprint = tasks.some(
                  (task) => task.sourceTemplateId === template.id && !task.completed,
                )

                return (
                  <div
                    key={template.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[color:var(--stroke)] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[color:var(--text-main)]">{template.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-soft)]">
                        <span>{recurrenceLabel[template.recurrence]}</span>
                        <span>{formatDueTimes(template.dueTimes)}</span>
                        <span>{formatDurationScore(template.durationScore)}</span>
                        <span>Dopex {(template.funScore * 1.25 + template.durationScore * 1.45).toFixed(1)}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 ${
                            due.urgent
                              ? 'bg-rose-500/18 text-rose-200'
                              : 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]'
                          }`}
                        >
                          {due.text}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditRecurring(template)}
                        className="rounded-full border border-[color:var(--stroke)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--text-main)]"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecurring(template.id)}
                        className="rounded-full border border-rose-300/40 px-2.5 py-1.5 text-xs font-semibold text-rose-300"
                      >
                        Löschen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadRecurring(template.id)}
                        disabled={alreadyInSprint || tasks.length >= 5}
                        className="rounded-full border border-[color:var(--stroke)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-main)] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {alreadyInSprint ? 'Im Sprint' : 'Laden'}
                      </button>
                    </div>
                  </div>
                )
              })}

              {recurringByUrgency.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[color:var(--stroke)] px-3 py-3 text-sm text-[color:var(--text-soft)]">
                  Lege tägliche oder wöchentliche Routinen an und lade sie bei Fälligkeit in deinen Sprint.
                </p>
              ) : null}
            </div>
          </motion.section>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <TimerRing
            percent={progressPercent}
            label={showBreakView ? (wallPreviewOpen ? 'Erledigt-Ansicht Vorschau' : 'Erledigt-Ansicht Pause') : '25 Minuten Fokus'}
            time={wallPreviewOpen ? '05:00' : displayTime}
          />

          <AnimatePresence mode="wait">
            {!showBreakView ? (
              <motion.div
                key="focus"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={springConfig}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--card-strong)] p-4">
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                    Mikro-Task hinzufügen ({tasks.length}/5)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={draftTask}
                      onChange={(event) => setDraftTask(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleAddTask()
                      }}
                      placeholder="z.B. Intro-Absatz finalisieren"
                      className="w-full rounded-xl border border-[color:var(--stroke)] bg-transparent px-3 py-2 text-base text-[color:var(--text-main)] outline-none placeholder:text-[color:var(--text-soft)] focus:border-[color:var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={handleAddTask}
                      className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Add
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-[color:var(--text-soft)]">Spass</span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={draftFunScore}
                        onChange={(event) => setDraftFunScore(Number(event.target.value))}
                        className="w-full accent-[color:var(--accent)]"
                      />
                      <span className="text-xs text-[color:var(--text-soft)]">{draftFunScore}/5</span>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-[color:var(--text-soft)]">Dauer</span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                          value={draftDurationScore}
                          onChange={(event) => setDraftDurationScore(Number(event.target.value))}
                        className="w-full accent-[color:var(--accent)]"
                      />
                      <span className="text-xs text-[color:var(--text-soft)]">1 = lang, 5 = kurz · {draftDurationScore}/5</span>
                    </label>
                  </div>

                  {topTask ? (
                    <div className="mt-3 rounded-xl border border-[color:var(--stroke)] bg-[color:var(--accent-soft)] px-3 py-2 text-sm text-[color:var(--text-main)]">
                      Nächste beste Aufgabe: <strong>{topTask.text}</strong> (Dopex {getDopexScore(topTask).toFixed(1)})
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-[color:var(--text-soft)]">
                    <span className="rounded-full border border-[color:var(--stroke)] px-2.5 py-1">
                      {sprintStarted ? 'Sprint vorbereitet' : 'Kein Sprint aktiv'}
                    </span>
                    <span className="rounded-full border border-[color:var(--stroke)] px-2.5 py-1">
                      {isRunning ? 'Timer läuft' : 'Timer bereit'}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-[color:var(--text-soft)]">{taskLabel}</p>
                </div>

                <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--card-strong)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="app-title text-lg font-semibold text-[color:var(--text-main)]">Dopex Matrix Ranking</h2>
                    <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">{totalDisplayTime}</span>
                  </div>

                  <p className="mb-3 rounded-xl border border-[color:var(--stroke)] bg-[color:var(--accent-soft)] px-3 py-2 text-xs uppercase tracking-[0.12em] text-[color:var(--text-soft)]">
                    Sortierung: zuerst hoher Spass + kurze Dauer, dann kurze Aufgaben.
                  </p>

                  <AnimatePresence initial={false}>
                    <motion.ul layout className="space-y-2">
                      {sortedTasks.map((task, index) => (
                        <TaskChip key={task.id} task={task} rank={index + 1} onComplete={handleComplete} />
                      ))}
                    </motion.ul>
                  </AnimatePresence>

                  {tasks.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[color:var(--stroke)] px-4 py-5 text-sm text-[color:var(--text-soft)]">
                      Starte mit 3 bis maximal 5 Mikro-Tasks fuer klaren Fokus.
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {!sprintStarted ? (
                    <button
                      type="button"
                      disabled={!canStart}
                      onClick={() => {
                        startSprint()
                        playUiClick(620)
                      }}
                      className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sprint vorbereiten
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setWallPreviewOpen(true)
                      playUiClick(500)
                    }}
                    className="rounded-xl border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--text-main)]"
                  >
                    Erledigt-Ansicht ansehen
                  </button>

                  {!isRunning ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (sprintStarted) {
                          resumeTimer()
                          playUiClick(560)
                          return
                        }

                        startTimer()
                        playUiClick(560)
                      }}
                      className="rounded-xl border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--text-main)]"
                    >
                      {timerButtonLabel}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        pauseTimer()
                        playUiClick(520)
                      }}
                      className="rounded-xl border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--text-main)]"
                    >
                      Pause
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      resetTimer()
                      setWallPreviewOpen(false)
                      playUiClick(440)
                    }}
                    className="rounded-xl border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--text-main)]"
                  >
                    Timer zurücksetzen
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={wallPreviewOpen ? 'break-preview' : 'break'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={springConfig}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--card-strong)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="app-title text-lg font-semibold">Erledigt-Ansicht</h2>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--accent)]">
                        {wallPreviewTasks.length} erledigte Mikro-Tasks
                      </p>
                    </div>
                    <div className="rounded-full border border-[color:var(--stroke)] bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                      Uebersicht
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-[color:var(--text-soft)]">
                    {wallPreviewOpen
                      ? 'Vorschau der Pausenansicht'
                      : 'Deine erledigten Mikro-Tasks werden hier als Uebersicht gesammelt.'}
                  </p>
                </div>

                <motion.div
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
                  }}
                >
                  {wallPreviewTasks.map((task, index) => {
                    const theme = getWallCardTheme(index)
                    const achievement = getWallAchievement(task)
                    const speedMedal = getSpeedMedal(task.durationMs)

                    return (
                    <motion.article
                      key={task.id}
                      variants={{ hidden: { opacity: 0, y: 18, scale: 0.92, rotate: -4 }, show: { opacity: 1, y: 0, scale: 1, rotate: index % 2 === 0 ? -1.5 : 1.5 } }}
                      transition={springConfig}
                      whileHover={{ y: -4, scale: 1.02, rotate: 0 }}
                      className="relative overflow-hidden rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--card-strong)] px-4 py-4 text-sm text-[color:var(--text-main)] shadow-[0_18px_32px_rgba(15,35,35,0.08)]"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent}`} aria-hidden="true" />
                      <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/20 blur-2xl" aria-hidden="true" />
                      <motion.span
                        aria-hidden="true"
                        initial={{ opacity: 0, scale: 0.2 }}
                        animate={{ opacity: [0, 0.95, 0], scale: [0.2, 1.2, 1.65] }}
                        transition={{ duration: 0.7, delay: index * 0.06 }}
                        className="absolute left-5 top-5 h-3 w-3 rounded-full bg-white/80 shadow-[0_0_22px_rgba(255,255,255,0.9)]"
                      />
                      <motion.span
                        aria-hidden="true"
                        initial={{ opacity: 0, scale: 0.2 }}
                        animate={{ opacity: [0, 0.9, 0], scale: [0.2, 1.15, 1.55], x: [0, 16, 24], y: [0, -10, -18] }}
                        transition={{ duration: 0.9, delay: index * 0.06 + 0.04 }}
                        className="absolute right-8 top-8 h-2.5 w-2.5 rounded-full bg-amber-100/90 shadow-[0_0_18px_rgba(254,240,138,0.8)]"
                      />
                      <motion.span
                        aria-hidden="true"
                        initial={{ opacity: 0, scale: 0.2 }}
                        animate={{ opacity: [0, 0.85, 0], scale: [0.2, 1.1, 1.4], x: [0, -18, -26], y: [0, 10, 18] }}
                        transition={{ duration: 0.95, delay: index * 0.06 + 0.08 }}
                        className="absolute bottom-8 right-10 h-2 w-2 rounded-full bg-sky-100/90 shadow-[0_0_18px_rgba(186,230,253,0.8)]"
                      />

                      <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${theme.badge}`}>
                                {theme.label}
                              </span>
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${speedMedal.tone}`}>
                                {speedMedal.label}
                              </span>
                            </div>
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                              {achievement}
                            </p>
                            <p className="mt-3 text-base font-semibold leading-snug text-[color:var(--text-main)]">
                              {task.text}
                            </p>
                          </div>
                          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/35 text-lg font-semibold text-[color:var(--accent)] backdrop-blur-sm">
                            OK
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-[color:var(--text-soft)]">
                          <span className="rounded-full border border-[color:var(--stroke)] bg-white/35 px-2.5 py-1">
                            Dopex {getDopexScore(task).toFixed(1)}
                          </span>
                          <span className="rounded-full border border-[color:var(--stroke)] bg-white/35 px-2.5 py-1">
                            Dauer {formatTaskDuration(task.durationMs)}
                          </span>
                          <span className="rounded-full border border-[color:var(--stroke)] bg-white/35 px-2.5 py-1">
                            {formatFunScore(task.funScore)}
                          </span>
                          <span className="rounded-full border border-[color:var(--stroke)] bg-white/35 px-2.5 py-1">
                            {formatDurationScore(task.durationScore)}
                          </span>
                        </div>
                      </div>
                    </motion.article>
                    )
                  })}
                </motion.div>

                {wallPreviewTasks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[color:var(--stroke)] p-5 text-sm text-[color:var(--text-soft)]">
                    Noch keine Tasks vorhanden. Lege erst ein paar Mikro-Tasks an, dann wird die Vorschau sinnvoller.
                  </p>
                ) : null}

                <div className="flex gap-2">
                  {wallPreviewOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        setWallPreviewOpen(false)
                        playUiClick(640)
                      }}
                      className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Zurück zum Sprint
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        startNextSprint()
                        playUiClick(640)
                      }}
                      className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Nächsten Sprint vorbereiten
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      resetTimer()
                      setWallPreviewOpen(false)
                      playUiClick(440)
                    }}
                    className="rounded-xl border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--text-main)]"
                  >
                    Timer zurücksetzen
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
