import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const FOCUS_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

export type SprintPhase = 'focus' | 'break'

export type RecurrenceType = 'daily' | 'weekly' | 'monthly'

export type MicroTask = {
  id: string
  text: string
  completed: boolean
  funScore: number
  durationScore: number
  sourceTemplateId?: string
  startedAt?: number
  completedAt?: number
  durationMs?: number
}

export type RecurringTaskTemplate = {
  id: string
  title: string
  recurrence: RecurrenceType
  dueTimes: string[]
  funScore: number
  durationScore: number
  createdAt: number
  lastCompletedAt: number | null
  nextDueAt: number
}

type PomodoroState = {
  phase: SprintPhase
  sprintStarted: boolean
  isRunning: boolean
  focusRemaining: number
  breakRemaining: number
  tasks: MicroTask[]
  recurringTemplates: RecurringTaskTemplate[]
  completedThisSprint: MicroTask[]
  sessionCount: number
  addTask: (text: string, funScore: number, durationScore: number) => void
  addRecurringTemplate: (
    title: string,
    recurrence: RecurrenceType,
    dueTimes: string[],
    funScore: number,
    durationScore: number,
  ) => void
  updateRecurringTemplate: (
    templateId: string,
    title: string,
    recurrence: RecurrenceType,
    dueTimes: string[],
    funScore: number,
    durationScore: number,
  ) => void
  deleteRecurringTemplate: (templateId: string) => void
  loadRecurringTaskToSprint: (templateId: string) => void
  completeTask: (id: string) => void
  archiveTask: (id: string) => void
  startSprint: () => void
  startTimer: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  startNextSprint: () => void
  tick: () => void
}

const taskId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.round(Math.random() * 100000)}`
}

const collectCompleted = (tasks: MicroTask[], existing: MicroTask[]) => {
  const map = new Map(existing.map((task) => [task.id, task]))
  for (const task of tasks) {
    if (task.completed && !map.has(task.id)) {
      map.set(task.id, task)
    }
  }

  return Array.from(map.values())
}
const cadenceToMs = (recurrence: RecurrenceType) => {
  if (recurrence === 'daily') {
    return 24 * 60 * 60 * 1000
  }

  if (recurrence === 'weekly') {
    return 7 * 24 * 60 * 60 * 1000
  }

  return 30 * 24 * 60 * 60 * 1000
}

const normalizeDueTimes = (dueTimes: string[]) => {
  const valid = dueTimes
    .map((value) => value.trim())
    .filter((value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value))

  const deduped = Array.from(new Set(valid))
  deduped.sort((left, right) => left.localeCompare(right))

  return deduped.length > 0 ? deduped : ['09:00']
}

const withTime = (base: Date, time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  const value = new Date(base)
  value.setHours(hours, minutes, 0, 0)
  return value
}

const getMonthlyDate = (year: number, month: number, dayOfMonth: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(dayOfMonth, lastDay))
}

const computeNextDueAt = (
  recurrence: RecurrenceType,
  dueTimes: string[],
  anchorAt: number,
  fromAt: number,
) => {
  const normalized = normalizeDueTimes(dueTimes)
  const fromDate = new Date(fromAt)
  const anchorDate = new Date(anchorAt)

  if (recurrence === 'daily') {
    for (let offset = 0; offset < 14; offset += 1) {
      const day = new Date(fromDate)
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() + offset)

      for (const time of normalized) {
        const candidate = withTime(day, time)
        if (candidate.getTime() > fromAt) {
          return candidate.getTime()
        }
      }
    }
  }

  if (recurrence === 'weekly') {
    const anchorDay = anchorDate.getDay()

    for (let offset = 0; offset < 56; offset += 1) {
      const day = new Date(fromDate)
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() + offset)

      if (day.getDay() !== anchorDay) {
        continue
      }

      for (const time of normalized) {
        const candidate = withTime(day, time)
        if (candidate.getTime() > fromAt) {
          return candidate.getTime()
        }
      }
    }
  }

  const anchorDayOfMonth = anchorDate.getDate()
  for (let offset = 0; offset < 24; offset += 1) {
    const year = fromDate.getFullYear()
    const month = fromDate.getMonth() + offset
    const candidateDay = getMonthlyDate(year, month, anchorDayOfMonth)

    for (const time of normalized) {
      const candidate = withTime(candidateDay, time)
      if (candidate.getTime() > fromAt) {
        return candidate.getTime()
      }
    }
  }

  return fromAt + cadenceToMs(recurrence)
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      phase: 'focus',
      sprintStarted: false,
      isRunning: false,
      focusRemaining: FOCUS_SECONDS,
      breakRemaining: BREAK_SECONDS,
      tasks: [],
      recurringTemplates: [],
      completedThisSprint: [],
      sessionCount: 0,

      addTask: (text, funScore, durationScore) => {
        set((state) => {
          if (state.phase !== 'focus' || state.tasks.length >= 5) {
            return state
          }

          const safeFunScore = Math.min(5, Math.max(1, Math.round(funScore)))
          const safeDurationScore = Math.min(5, Math.max(1, Math.round(durationScore)))

          return {
            tasks: [
              ...state.tasks,
              {
                id: taskId(),
                text,
                completed: false,
                funScore: safeFunScore,
                durationScore: safeDurationScore,
                startedAt: Date.now(),
              },
            ],
          }
        })
      },

      addRecurringTemplate: (title, recurrence, dueTimes, funScore, durationScore) => {
        set((state) => {
          const cleanTitle = title.trim()
          if (!cleanTitle) {
            return state
          }

          const safeFunScore = Math.min(5, Math.max(1, Math.round(funScore)))
          const safeDurationScore = Math.min(5, Math.max(1, Math.round(durationScore)))
          const now = Date.now()
          const normalizedDueTimes = normalizeDueTimes(dueTimes)

          return {
            recurringTemplates: [
              ...state.recurringTemplates,
              {
                id: taskId(),
                title: cleanTitle,
                recurrence,
                dueTimes: normalizedDueTimes,
                funScore: safeFunScore,
                durationScore: safeDurationScore,
                createdAt: now,
                lastCompletedAt: null,
                nextDueAt: computeNextDueAt(recurrence, normalizedDueTimes, now, now - 1),
              },
            ],
          }
        })
      },

      updateRecurringTemplate: (templateId, title, recurrence, dueTimes, funScore, durationScore) => {
        set((state) => {
          const cleanTitle = title.trim()
          if (!cleanTitle) {
            return state
          }

          const target = state.recurringTemplates.find((template) => template.id === templateId)
          if (!target) {
            return state
          }

          const safeFunScore = Math.min(5, Math.max(1, Math.round(funScore)))
          const safeDurationScore = Math.min(5, Math.max(1, Math.round(durationScore)))
          const normalizedDueTimes = normalizeDueTimes(dueTimes)
          const now = Date.now()

          return {
            recurringTemplates: state.recurringTemplates.map((template) =>
              template.id === templateId
                ? {
                    ...template,
                    title: cleanTitle,
                    recurrence,
                    dueTimes: normalizedDueTimes,
                    funScore: safeFunScore,
                    durationScore: safeDurationScore,
                    nextDueAt: computeNextDueAt(
                      recurrence,
                      normalizedDueTimes,
                      template.createdAt,
                      Math.max(now - 1, template.lastCompletedAt ?? 0),
                    ),
                  }
                : template,
            ),
            tasks: state.tasks.map((task) =>
              task.sourceTemplateId === templateId && !task.completed
                ? {
                    ...task,
                    text: cleanTitle,
                    funScore: safeFunScore,
                    durationScore: safeDurationScore,
                  }
                : task,
            ),
          }
        })
      },

      deleteRecurringTemplate: (templateId) => {
        set((state) => ({
          recurringTemplates: state.recurringTemplates.filter((template) => template.id !== templateId),
          tasks: state.tasks.filter(
            (task) => task.sourceTemplateId !== templateId || task.completed,
          ),
        }))
      },

      loadRecurringTaskToSprint: (templateId) => {
        set((state) => {
          if (state.phase !== 'focus' || state.tasks.length >= 5) {
            return state
          }

          const template = state.recurringTemplates.find((item) => item.id === templateId)
          if (!template) {
            return state
          }

          const alreadyLoaded = state.tasks.some(
            (task) => task.sourceTemplateId === templateId && !task.completed,
          )

          if (alreadyLoaded) {
            return state
          }

          return {
            tasks: [
              ...state.tasks,
              {
                id: taskId(),
                text: template.title,
                completed: false,
                funScore: template.funScore,
                durationScore: template.durationScore,
                sourceTemplateId: template.id,
                startedAt: Date.now(),
              },
            ],
          }
        })
      },

      completeTask: (id) => {
        const now = Date.now()

        set((currentState) => {
          const target = currentState.tasks.find((task) => task.id === id)
          if (!target || target.completed) {
            return currentState
          }

          const completedTasks = currentState.tasks.map((task) =>
            task.id === id && !task.completed
              ? {
                  ...task,
                  completed: true,
                  durationMs: task.startedAt ? Math.max(15_000, now - task.startedAt) : undefined,
                  completedAt: now,
                }
              : task,
          )

          const updatedTemplates = target.sourceTemplateId
            ? currentState.recurringTemplates.map((template) => {
                if (template.id !== target.sourceTemplateId) {
                  return template
                }

                return {
                  ...template,
                  lastCompletedAt: now,
                  nextDueAt: computeNextDueAt(
                    template.recurrence,
                    template.dueTimes,
                    template.createdAt,
                    now,
                  ),
                }
              })
            : currentState.recurringTemplates

          return {
            tasks: completedTasks,
            recurringTemplates: updatedTemplates,
          }
        })
      },

      archiveTask: (id) => {
        set((state) => {
          const target = state.tasks.find((task) => task.id === id)
          if (!target || !target.completed) {
            return state
          }

          const inWall = state.completedThisSprint.some((task) => task.id === id)

          return {
            tasks: state.tasks.filter((task) => task.id !== id),
            completedThisSprint: inWall ? state.completedThisSprint : [...state.completedThisSprint, target],
          }
        })
      },

      startSprint: () => {
        set((state) => {
          if (state.phase !== 'focus' || state.tasks.length < 3 || state.tasks.length > 5) {
            return state
          }

          return {
            sprintStarted: true,
            isRunning: false,
          }
        })
      },

      startTimer: () => {
        set((state) => {
          if (state.phase !== 'focus' && state.phase !== 'break') {
            return state
          }

          return {
            isRunning: true,
          }
        })
      },

      pauseTimer: () => {
        set({ isRunning: false })
      },

      resumeTimer: () => {
        set({ isRunning: true })
      },

      startNextSprint: () => {
        set((state) => ({
          phase: 'focus',
          sprintStarted: false,
          isRunning: false,
          focusRemaining: FOCUS_SECONDS,
          breakRemaining: BREAK_SECONDS,
          completedThisSprint: [],
          tasks: state.tasks.filter((task) => !task.completed),
        }))
      },

      tick: () => {
        const state = get()
        if (!state.isRunning) {
          return
        }

        if (state.phase === 'focus') {
          if (state.focusRemaining <= 1) {
            const done = collectCompleted(state.tasks, state.completedThisSprint)

            set({
              phase: 'break',
              sprintStarted: false,
              isRunning: true,
              focusRemaining: FOCUS_SECONDS,
              breakRemaining: BREAK_SECONDS,
              tasks: state.tasks.filter((task) => !task.completed),
              completedThisSprint: done,
              sessionCount: state.sessionCount + 1,
            })
            return
          }

          set({
            focusRemaining: state.focusRemaining - 1,
          })

          return
        }

        if (state.breakRemaining <= 1) {
          set({
            phase: 'focus',
            sprintStarted: false,
            isRunning: false,
            breakRemaining: BREAK_SECONDS,
            focusRemaining: FOCUS_SECONDS,
          })
          return
        }

        set({
          breakRemaining: state.breakRemaining - 1,
        })
      },
    }),
    {
      name: 'pomodoro-dopex-store',
      version: 7,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = persistedState as
          | (Partial<PomodoroState> & {
              totalXp?: number
              currentStreak?: number
              bestStreak?: number
              lastCompletionAt?: number | null
            })
          | undefined

        const withDefaults = (task: MicroTask & { speedScore?: number }) => ({
          ...task,
          funScore: task.funScore ?? 3,
          durationScore: task.durationScore ?? task.speedScore ?? 3,
          startedAt: task.startedAt,
          durationMs: task.durationMs,
        })

        const normalizedTemplates = (state?.recurringTemplates ?? []).map((template) => {
          const dueTimes = normalizeDueTimes(template.dueTimes ?? ['09:00'])
          const typedTemplate = template as RecurringTaskTemplate & { speedScore?: number }

          return {
            ...typedTemplate,
            dueTimes,
            durationScore: typedTemplate.durationScore ?? typedTemplate.speedScore ?? 3,
            nextDueAt: template.nextDueAt ?? computeNextDueAt(template.recurrence, dueTimes, template.createdAt, Date.now()),
          }
        })

        return {
          ...state,
          tasks: (state?.tasks ?? []).map(withDefaults),
          recurringTemplates: normalizedTemplates,
          completedThisSprint: (state?.completedThisSprint ?? []).map(withDefaults),
        }
      },
      partialize: (state) => ({
        phase: state.phase,
        sprintStarted: state.sprintStarted,
        isRunning: state.isRunning,
        focusRemaining: state.focusRemaining,
        breakRemaining: state.breakRemaining,
        tasks: state.tasks,
        recurringTemplates: state.recurringTemplates,
        completedThisSprint: state.completedThisSprint,
        sessionCount: state.sessionCount,
      }),
    },
  ),
)
