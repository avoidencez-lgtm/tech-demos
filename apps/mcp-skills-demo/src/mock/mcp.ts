import {
  findSkill,
  SERVER_INFO,
  SKILL_INDEX,
  type MockSkill,
  type SkillIndexEntry,
  type SkillMetadata,
} from './skills'

export interface LogEntry {
  id: string
  direction: 'client' | 'server'
  method: string
  summary: string
  payload: unknown
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function jitter(min = 280, max = 620): number {
  return Math.round(min + Math.random() * (max - min))
}

let rpcId = 0

function nextId(): number {
  rpcId += 1
  return rpcId
}

export async function initialize(): Promise<{
  info: typeof SERVER_INFO
  logs: LogEntry[]
}> {
  const id = nextId()
  await wait(jitter())
  return {
    info: SERVER_INFO,
    logs: [
      {
        id: `req-${id}`,
        direction: 'client',
        method: 'initialize',
        summary: 'Handshake + ask for skills extension',
        payload: {
          jsonrpc: '2.0',
          id,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            clientInfo: { name: 'mcp-skills-demo', version: '0.1.0' },
            capabilities: {},
          },
        },
      },
      {
        id: `res-${id}`,
        direction: 'server',
        method: 'initialize',
        summary: `${SERVER_INFO.name} advertises io.modelcontextprotocol/skills`,
        payload: {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: SERVER_INFO.protocolVersion,
            serverInfo: {
              name: SERVER_INFO.name,
              version: SERVER_INFO.version,
            },
            capabilities: SERVER_INFO.capabilities,
          },
        },
      },
    ],
  }
}

export async function discoverSkills(): Promise<{
  skills: SkillIndexEntry[]
  logs: LogEntry[]
}> {
  const id = nextId()
  await wait(jitter(360, 720))
  return {
    skills: SKILL_INDEX.skills,
    logs: [
      {
        id: `req-${id}`,
        direction: 'client',
        method: 'resources/read',
        summary: 'Read well-known skill://index.json',
        payload: {
          jsonrpc: '2.0',
          id,
          method: 'resources/read',
          params: { uri: 'skill://index.json' },
        },
      },
      {
        id: `res-${id}`,
        direction: 'server',
        method: 'resources/read',
        summary: `Catalog returned ${SKILL_INDEX.skills.length} skills`,
        payload: {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri: 'skill://index.json',
                mimeType: 'application/json',
                text: JSON.stringify(SKILL_INDEX, null, 2),
              },
            ],
          },
        },
      },
    ],
  }
}

export async function readSkillMetadata(name: string): Promise<{
  skill: MockSkill
  metadata: SkillMetadata
  logs: LogEntry[]
}> {
  const skill = findSkill(name)
  if (!skill) {
    throw new Error(`Unknown skill: ${name}`)
  }
  const id = nextId()
  await wait(jitter(240, 480))
  return {
    skill,
    metadata: skill.metadata,
    logs: [
      {
        id: `req-${id}`,
        direction: 'client',
        method: 'resources/list',
        summary: `Resolve metadata for ${skill.metadata.uri}`,
        payload: {
          jsonrpc: '2.0',
          id,
          method: 'resources/list',
          params: { prefix: skill.metadata.uri.replace(/SKILL\.md$/, '') },
        },
      },
      {
        id: `res-${id}`,
        direction: 'server',
        method: 'resources/list',
        summary: 'Name, description, mimeType — still no SKILL.md body',
        payload: {
          jsonrpc: '2.0',
          id,
          result: {
            resources: [
              {
                uri: skill.metadata.uri,
                name: skill.metadata.name,
                description: skill.metadata.description,
                mimeType: skill.metadata.mimeType,
                _meta: skill.metadata._meta,
              },
            ],
          },
        },
      },
    ],
  }
}

export async function loadSkillMarkdown(name: string): Promise<{
  skill: MockSkill
  logs: LogEntry[]
}> {
  const skill = findSkill(name)
  if (!skill) {
    throw new Error(`Unknown skill: ${name}`)
  }
  const id = nextId()
  await wait(jitter(380, 740))
  return {
    skill,
    logs: [
      {
        id: `req-${id}`,
        direction: 'client',
        method: 'resources/read',
        summary: `Load ${skill.metadata.uri} only now`,
        payload: {
          jsonrpc: '2.0',
          id,
          method: 'resources/read',
          params: { uri: skill.metadata.uri },
        },
      },
      {
        id: `res-${id}`,
        direction: 'server',
        method: 'resources/read',
        summary: `SKILL.md (${skill.body.length} chars) entered context`,
        payload: {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri: skill.metadata.uri,
                mimeType: skill.metadata.mimeType,
                text: skill.body,
              },
            ],
          },
        },
      },
    ],
  }
}
