export type Operation =
  | 'CLICK'
  | 'TYPE_TEXT'
  | 'SELECT'
  | 'SCROLL_UP'
  | 'SCROLL_DOWN'
  | 'WAIT'
  | 'DONE'
  | 'BLOCKED'

export type ActionRole = 'button' | 'combobox' | 'textbox' | 'option' | 'status' | 'link'

export type ActionTarget = {
  index: number
  role: ActionRole
  name: string
  value: string
  ops: Operation[]
}

export type PageKind = 'form' | 'suggest-from' | 'suggest-to' | 'calendar' | 'loading' | 'results'

export type PageState = {
  kind: PageKind
  trip: 'round' | 'oneway'
  from: string
  to: string
  date: string
  travelers: string
  fromQuery?: string
  toQuery?: string
}

export type Decision = {
  operation: Operation
  operationProbs: Partial<Record<Operation, number>>
  clickTarget?: number
  typeTextTarget?: number
  selectTarget?: number
  text?: string
  textLatencyMs?: number
  jevLatencyMs: number
  note: string
}

export type Step = {
  id: number
  elapsedMs: number
  naiveElapsedMs: number
  jevCalls: number
  naiveCalls: number
  page: PageState
  actions: ActionTarget[]
  decision: Decision
}

export const GOAL =
  'Find one-way flights from Zurich to London on September 20, 2026, for one adult in economy. Stop when matching flight options are visible.'

export const START_URL = 'https://www.google.com/travel/flights?hl=en'

export const HEADLINE = {
  jevMs: 7073,
  naiveMs: 9450,
  jevCalls: 101,
  naiveCalls: 1092,
  jevRequests: 17,
  naiveRequests: 22,
  jevMedianMs: 7092,
  naiveMedianMs: 9450,
} as const

const FORM_TRAVELERS = '1 adult · Economy'

function formActions(page: PageState): ActionTarget[] {
  const tripName = page.trip === 'oneway' ? 'One way' : 'Round trip'
  const actions: ActionTarget[] = [
    { index: 1, role: 'button', name: 'Change ticket type', value: tripName, ops: ['CLICK'] },
    { index: 2, role: 'combobox', name: 'Where from?', value: page.from || 'empty', ops: ['CLICK', 'TYPE_TEXT'] },
    { index: 3, role: 'combobox', name: 'Where to?', value: page.to || 'empty', ops: ['CLICK', 'TYPE_TEXT'] },
    { index: 4, role: 'textbox', name: 'Departure', value: page.date || 'empty', ops: ['CLICK'] },
  ]
  if (page.trip === 'round') {
    actions.push({ index: 5, role: 'textbox', name: 'Return', value: 'empty', ops: ['CLICK'] })
    actions.push({
      index: 6,
      role: 'button',
      name: 'Travelers',
      value: page.travelers,
      ops: ['CLICK'],
    })
    actions.push({ index: 7, role: 'button', name: 'Search', value: '', ops: ['CLICK'] })
    actions.push({ index: 8, role: 'link', name: 'Explore destinations', value: '', ops: ['CLICK'] })
    return actions
  }
  actions.push({
    index: 5,
    role: 'button',
    name: 'Travelers',
    value: page.travelers,
    ops: ['CLICK'],
  })
  actions.push({ index: 6, role: 'button', name: 'Search', value: '', ops: ['CLICK'] })
  return actions
}

export const STEPS: Step[] = [
  {
    id: 1,
    elapsedMs: 180,
    naiveElapsedMs: 220,
    jevCalls: 9,
    naiveCalls: 102,
    page: {
      kind: 'form',
      trip: 'round',
      from: '',
      to: '',
      date: '',
      travelers: FORM_TRAVELERS,
    },
    actions: formActions({
      kind: 'form',
      trip: 'round',
      from: '',
      to: '',
      date: '',
      travelers: FORM_TRAVELERS,
    }),
    decision: {
      operation: 'CLICK',
      operationProbs: { CLICK: 0.81, TYPE_TEXT: 0.09, WAIT: 0.06, DONE: 0.03, SELECT: 0.01 },
      clickTarget: 1,
      typeTextTarget: 2,
      jevLatencyMs: 164,
      note: 'Goal says one-way. Speculative TYPE_TEXT head is computed, then discarded.',
    },
  },
  {
    id: 2,
    elapsedMs: 420,
    naiveElapsedMs: 510,
    jevCalls: 6,
    naiveCalls: 88,
    page: {
      kind: 'form',
      trip: 'oneway',
      from: '',
      to: '',
      date: '',
      travelers: FORM_TRAVELERS,
    },
    actions: formActions({
      kind: 'form',
      trip: 'oneway',
      from: '',
      to: '',
      date: '',
      travelers: FORM_TRAVELERS,
    }),
    decision: {
      operation: 'WAIT',
      operationProbs: { WAIT: 0.62, TYPE_TEXT: 0.24, CLICK: 0.1, DONE: 0.04 },
      clickTarget: 6,
      typeTextTarget: 2,
      jevLatencyMs: 151,
      note: 'Trip-type control just changed. Wait a frame instead of predicting into a mutating tree.',
    },
  },
  {
    id: 3,
    elapsedMs: 1180,
    naiveElapsedMs: 1480,
    jevCalls: 14,
    naiveCalls: 124,
    page: {
      kind: 'form',
      trip: 'oneway',
      from: '',
      to: '',
      date: '',
      travelers: FORM_TRAVELERS,
    },
    actions: formActions({
      kind: 'form',
      trip: 'oneway',
      from: '',
      to: '',
      date: '',
      travelers: FORM_TRAVELERS,
    }),
    decision: {
      operation: 'TYPE_TEXT',
      operationProbs: { TYPE_TEXT: 0.88, CLICK: 0.07, WAIT: 0.03, DONE: 0.02 },
      clickTarget: 2,
      typeTextTarget: 2,
      text: 'Zurich',
      textLatencyMs: 581,
      jevLatencyMs: 178,
      note: 'Jev only picks TYPE_TEXT [2]. A small text model writes the city string.',
    },
  },
  {
    id: 4,
    elapsedMs: 1480,
    naiveElapsedMs: 1780,
    jevCalls: 8,
    naiveCalls: 96,
    page: {
      kind: 'suggest-from',
      trip: 'oneway',
      from: '',
      to: '',
      date: '',
      travelers: FORM_TRAVELERS,
      fromQuery: 'Zurich',
    },
    actions: [
      { index: 1, role: 'button', name: 'Change ticket type', value: 'One way', ops: ['CLICK'] },
      { index: 2, role: 'combobox', name: 'Where from?', value: 'Zurich', ops: ['CLICK', 'TYPE_TEXT'] },
      { index: 3, role: 'option', name: 'Zürich (ZRH)', value: 'Zürich Airport', ops: ['CLICK'] },
      { index: 4, role: 'option', name: 'Zurich Airport', value: 'ZRH', ops: ['CLICK'] },
      { index: 5, role: 'combobox', name: 'Where to?', value: 'empty', ops: ['CLICK', 'TYPE_TEXT'] },
      { index: 6, role: 'textbox', name: 'Departure', value: 'empty', ops: ['CLICK'] },
      { index: 7, role: 'button', name: 'Search', value: '', ops: ['CLICK'] },
    ],
    decision: {
      operation: 'CLICK',
      operationProbs: { CLICK: 0.91, WAIT: 0.05, TYPE_TEXT: 0.03, DONE: 0.01 },
      clickTarget: 3,
      typeTextTarget: 5,
      jevLatencyMs: 172,
      note: 'Suggestions arrived. Compatible click targets now include the airport options.',
    },
  },
  {
    id: 5,
    elapsedMs: 2020,
    naiveElapsedMs: 2520,
    jevCalls: 12,
    naiveCalls: 118,
    page: {
      kind: 'form',
      trip: 'oneway',
      from: 'Zürich (ZRH)',
      to: '',
      date: '',
      travelers: FORM_TRAVELERS,
    },
    actions: formActions({
      kind: 'form',
      trip: 'oneway',
      from: 'Zürich (ZRH)',
      to: '',
      date: '',
      travelers: FORM_TRAVELERS,
    }),
    decision: {
      operation: 'TYPE_TEXT',
      operationProbs: { TYPE_TEXT: 0.86, CLICK: 0.08, WAIT: 0.04, DONE: 0.02 },
      clickTarget: 6,
      typeTextTarget: 3,
      text: 'London',
      textLatencyMs: 346,
      jevLatencyMs: 169,
      note: 'Second helper call. Mercury writes “London”; Jev already chose the target.',
    },
  },
  {
    id: 6,
    elapsedMs: 2310,
    naiveElapsedMs: 2810,
    jevCalls: 8,
    naiveCalls: 94,
    page: {
      kind: 'suggest-to',
      trip: 'oneway',
      from: 'Zürich (ZRH)',
      to: '',
      date: '',
      travelers: FORM_TRAVELERS,
      toQuery: 'London',
    },
    actions: [
      { index: 1, role: 'button', name: 'Change ticket type', value: 'One way', ops: ['CLICK'] },
      { index: 2, role: 'combobox', name: 'Where from?', value: 'Zürich (ZRH)', ops: ['CLICK', 'TYPE_TEXT'] },
      { index: 3, role: 'combobox', name: 'Where to?', value: 'London', ops: ['CLICK', 'TYPE_TEXT'] },
      { index: 4, role: 'option', name: 'London (All airports)', value: 'LON', ops: ['CLICK'] },
      { index: 5, role: 'option', name: 'London Heathrow (LHR)', value: 'LHR', ops: ['CLICK'] },
      { index: 6, role: 'option', name: 'London Gatwick (LGW)', value: 'LGW', ops: ['CLICK'] },
      { index: 7, role: 'textbox', name: 'Departure', value: 'empty', ops: ['CLICK'] },
      { index: 8, role: 'button', name: 'Search', value: '', ops: ['CLICK'] },
    ],
    decision: {
      operation: 'CLICK',
      operationProbs: { CLICK: 0.9, WAIT: 0.06, TYPE_TEXT: 0.03, DONE: 0.01 },
      clickTarget: 4,
      typeTextTarget: 3,
      jevLatencyMs: 188,
      note: 'All-airports is the cheapest match for “London” without extra planning.',
    },
  },
  {
    id: 7,
    elapsedMs: 2620,
    naiveElapsedMs: 3180,
    jevCalls: 8,
    naiveCalls: 98,
    page: {
      kind: 'form',
      trip: 'oneway',
      from: 'Zürich (ZRH)',
      to: 'London',
      date: '',
      travelers: FORM_TRAVELERS,
    },
    actions: formActions({
      kind: 'form',
      trip: 'oneway',
      from: 'Zürich (ZRH)',
      to: 'London',
      date: '',
      travelers: FORM_TRAVELERS,
    }),
    decision: {
      operation: 'CLICK',
      operationProbs: { CLICK: 0.84, TYPE_TEXT: 0.08, WAIT: 0.05, DONE: 0.03 },
      clickTarget: 4,
      typeTextTarget: 3,
      jevLatencyMs: 177,
      note: 'Open the departure control. Still one request: operation + click_target.',
    },
  },
  {
    id: 8,
    elapsedMs: 2940,
    naiveElapsedMs: 3560,
    jevCalls: 8,
    naiveCalls: 92,
    page: {
      kind: 'calendar',
      trip: 'oneway',
      from: 'Zürich (ZRH)',
      to: 'London',
      date: '',
      travelers: FORM_TRAVELERS,
    },
    actions: [
      { index: 1, role: 'button', name: 'Change ticket type', value: 'One way', ops: ['CLICK'] },
      { index: 2, role: 'combobox', name: 'Where from?', value: 'Zürich (ZRH)', ops: ['CLICK', 'TYPE_TEXT'] },
      { index: 3, role: 'combobox', name: 'Where to?', value: 'London', ops: ['CLICK', 'TYPE_TEXT'] },
      { index: 4, role: 'textbox', name: 'Departure', value: 'empty', ops: ['CLICK'] },
      { index: 5, role: 'button', name: 'Sat 19 Sep', value: '2026-09-19', ops: ['CLICK'] },
      { index: 6, role: 'button', name: 'Sun 20 Sep', value: '2026-09-20', ops: ['CLICK'] },
      { index: 7, role: 'button', name: 'Mon 21 Sep', value: '2026-09-21', ops: ['CLICK'] },
      { index: 8, role: 'button', name: 'Search', value: '', ops: ['CLICK'] },
    ],
    decision: {
      operation: 'CLICK',
      operationProbs: { CLICK: 0.93, WAIT: 0.04, DONE: 0.02, TYPE_TEXT: 0.01 },
      clickTarget: 6,
      typeTextTarget: 2,
      jevLatencyMs: 181,
      note: 'Indexed date cells — no selector, no screenshot crop, no coordinate guess.',
    },
  },
  {
    id: 9,
    elapsedMs: 5217,
    naiveElapsedMs: 6280,
    jevCalls: 10,
    naiveCalls: 110,
    page: {
      kind: 'form',
      trip: 'oneway',
      from: 'Zürich (ZRH)',
      to: 'London',
      date: 'Sun, Sep 20',
      travelers: FORM_TRAVELERS,
    },
    actions: formActions({
      kind: 'form',
      trip: 'oneway',
      from: 'Zürich (ZRH)',
      to: 'London',
      date: 'Sun, Sep 20',
      travelers: FORM_TRAVELERS,
    }),
    decision: {
      operation: 'CLICK',
      operationProbs: { CLICK: 0.89, WAIT: 0.05, DONE: 0.04, TYPE_TEXT: 0.02 },
      clickTarget: 6,
      typeTextTarget: 2,
      jevLatencyMs: 190,
      note: 'Form is complete. Search is the only useful click_target.',
    },
  },
  {
    id: 10,
    elapsedMs: 5580,
    naiveElapsedMs: 7120,
    jevCalls: 8,
    naiveCalls: 86,
    page: {
      kind: 'loading',
      trip: 'oneway',
      from: 'Zürich (ZRH)',
      to: 'London',
      date: 'Sun, Sep 20',
      travelers: FORM_TRAVELERS,
    },
    actions: [
      { index: 1, role: 'status', name: 'Loading flight results', value: 'Searching ZRH → LON', ops: ['WAIT'] },
      { index: 2, role: 'button', name: 'Stop', value: '', ops: ['CLICK'] },
    ],
    decision: {
      operation: 'WAIT',
      operationProbs: { WAIT: 0.78, DONE: 0.12, CLICK: 0.08, BLOCKED: 0.02 },
      clickTarget: 2,
      jevLatencyMs: 159,
      note: 'Results are not visible yet. DONE would fail the independent checker.',
    },
  },
  {
    id: 11,
    elapsedMs: 7073,
    naiveElapsedMs: 9450,
    jevCalls: 10,
    naiveCalls: 84,
    page: {
      kind: 'results',
      trip: 'oneway',
      from: 'Zürich (ZRH)',
      to: 'London',
      date: 'Sun, Sep 20',
      travelers: FORM_TRAVELERS,
    },
    actions: [
      { index: 1, role: 'button', name: 'Change ticket type', value: 'One way', ops: ['CLICK'] },
      { index: 2, role: 'combobox', name: 'Where from?', value: 'Zürich (ZRH)', ops: ['CLICK', 'TYPE_TEXT'] },
      { index: 3, role: 'combobox', name: 'Where to?', value: 'London', ops: ['CLICK', 'TYPE_TEXT'] },
      { index: 4, role: 'textbox', name: 'Departure', value: 'Sun, Sep 20', ops: ['CLICK'] },
      { index: 5, role: 'button', name: 'Search', value: '', ops: ['CLICK'] },
      { index: 6, role: 'button', name: 'easyJet U2 1406', value: '$67', ops: ['CLICK'] },
      { index: 7, role: 'button', name: 'SWISS LX 318', value: '$89', ops: ['CLICK'] },
      { index: 8, role: 'button', name: 'British Airways BA 715', value: '$112', ops: ['CLICK'] },
      { index: 9, role: 'status', name: 'Matching options visible', value: '12 results · Best', ops: ['DONE'] },
    ],
    decision: {
      operation: 'DONE',
      operationProbs: { DONE: 0.83, CLICK: 0.09, WAIT: 0.06, TYPE_TEXT: 0.02 },
      clickTarget: 6,
      jevLatencyMs: 201,
      note: 'Independent check: one-way, Zürich, London, Sep 20, options on screen. Stop.',
    },
  },
]

export const RESULTS = [
  { id: 'u2', flight: 'U2 1406', carrier: 'easyJet', route: 'ZRH → LTN', time: '14:20 – 15:10', dur: '1h 50m', price: '$67' },
  { id: 'lx', flight: 'LX 318', carrier: 'SWISS', route: 'ZRH → LHR', time: '07:10 – 08:05', dur: '1h 55m', price: '$89' },
  { id: 'ba', flight: 'BA 715', carrier: 'British Airways', route: 'ZRH → LHR', time: '10:40 – 11:35', dur: '1h 55m', price: '$112' },
] as const

export function totalsThrough(index: number) {
  const slice = STEPS.slice(0, Math.max(0, index))
  return {
    jevCalls: slice.reduce((sum, step) => sum + step.jevCalls, 0),
    naiveCalls: slice.reduce((sum, step) => sum + step.naiveCalls, 0),
    jevMs: slice.at(-1)?.elapsedMs ?? 0,
    naiveMs: slice.at(-1)?.naiveElapsedMs ?? 0,
    jevRequests: slice.length,
    naiveRequests: slice.length * 2,
  }
}

export function compatibleTargets(actions: ActionTarget[], operation: Operation) {
  return actions.filter((action) => action.ops.includes(operation))
}

export function targetFor(step: Step) {
  const { decision } = step
  if (decision.operation === 'TYPE_TEXT') return decision.typeTextTarget
  if (decision.operation === 'SELECT') return decision.selectTarget
  if (decision.operation === 'CLICK') return decision.clickTarget
  return undefined
}

export function formatMs(ms: number) {
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(3)} s`
}

export function formatCalls(n: number) {
  return n.toLocaleString('en-US')
}
