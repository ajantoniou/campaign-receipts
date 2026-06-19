#!/usr/bin/env node
/**
 * Lightweight weekly summary for the vitals beacon.
 * Reads runtime/vitals/vitals.jsonl (written by the API) and emits a CSV per week.
 */
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.dirname(scriptDir)
const logDir = path.join(appRoot, 'runtime', 'vitals')
const logFile = path.join(logDir, 'vitals.jsonl')
const rollupDir = path.join(logDir, 'rollups')

const args = process.argv.slice(2)
const startOpt = args.find((arg) => arg.startsWith('--start='))
const weekOpt = args.find((arg) => arg.startsWith('--week='))

async function main() {
  const start = determineStart(startOpt ? startOpt.replace('--start=', '') : undefined, weekOpt ? weekOpt.replace('--week=', '') : undefined)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 7)

  let data
  try {
    data = await readFile(logFile, 'utf8')
  } catch {
    console.info('No vitals log found at', logFile)
    return
  }

  const records = data
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)

  const stats = new Map()

  for (const record of records) {
    const timestamp = resolveTimestamp(record)
    if (!timestamp || timestamp < start || timestamp >= end) continue

    const pathname = normalizePathname(record.pathname ?? record.payload?.pathname ?? record.slug ?? 'unknown')
    const metrics = extractMetrics(record.payload ?? record.body)

    for (const metric of metrics) {
      const value = normalizeValue(metric)
      if (!Number.isFinite(value)) continue
      const key = `${metric.name ?? 'unknown'}|||${pathname}`
      const entry = stats.get(key) ?? { metric: metric.name ?? 'unknown', pathname, count: 0, total: 0, min: Infinity, max: -Infinity }
      entry.count += 1
      entry.total += value
      entry.min = Math.min(entry.min, value)
      entry.max = Math.max(entry.max, value)
      stats.set(key, entry)
    }
  }

  const weekLabel = start.toISOString().slice(0, 10)
  if (stats.size === 0) {
    console.info('No vitals metrics for week starting', weekLabel)
    return
  }

  const rows = Array.from(stats.values()).map((entry) => ({
    ...entry,
    avg: entry.count ? entry.total / entry.count : 0,
  }))

  const csvLines = ['week_start,metric,pathname,count,avg,min,max', ...rows.map((row) => serializeCsvRow(weekLabel, row))]
  await mkdir(rollupDir, { recursive: true })
  const outFile = path.join(rollupDir, `vitals-rollup-${weekLabel}.csv`)
  await writeFile(outFile, csvLines.join('\n') + '\n', 'utf8')

  console.info('Wrote vitals weekly rollup:', outFile)
}

function determineStart(startValue, weekValue) {
  if (startValue) {
    const parsed = new Date(`${startValue}T00:00:00.000Z`)
    if (!Number.isNaN(parsed.getTime())) return parsed
    throw new Error(`Invalid start date: ${startValue}`)
  }
  if (weekValue) {
    const [yearPart, weekPart] = weekValue.split('-W')
    const year = Number(yearPart)
    const week = Number(weekPart)
    if (!Number.isInteger(year) || !Number.isFinite(week) || week < 1 || week > 53) {
      throw new Error(`Invalid iso week: ${weekValue}`)
    }
    return isoWeekStart(year, week)
  }
  return startOfCurrentWeek()
}

function startOfCurrentWeek() {
  const now = new Date()
  const copy = new Date(now)
  const day = (copy.getUTCDay() + 6) % 7
  copy.setUTCDate(copy.getUTCDate() - day)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}

function isoWeekStart(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const day = jan4.getUTCDay() || 7
  const monday = new Date(jan4)
  monday.setUTCDate(jan4.getUTCDate() - (day - 1) + (week - 1) * 7)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

function resolveTimestamp(record) {
  const candidate = record.timestamp ?? record.receivedAt ?? record.payload?.timestamp ?? record.body?.timestamp
  if (!candidate) return null
  const parsed = new Date(candidate)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function extractMetrics(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (typeof payload === 'object' && payload !== null) {
    if (Array.isArray(payload.entries)) return payload.entries
    if (typeof payload.name === 'string' || typeof payload.value === 'number') {
      return [payload]
    }
  }
  return []
}

function normalizeValue(metric) {
  if (!metric || typeof metric !== 'object') return NaN
  const candidate = metric.value ?? metric.delta ?? metric.deltaValue
  if (typeof candidate === 'number') return candidate
  const parsed = Number(candidate)
  return Number.isFinite(parsed) ? parsed : NaN
}

function normalizePathname(pathname) {
  const normalized = typeof pathname === 'string' ? pathname : 'unknown'
  if (!normalized.startsWith('/')) return `/${normalized}`
  return normalized
}

function serializeCsvRow(weekLabel, row) {
  return [
    weekLabel,
    escapeCsv(String(row.metric ?? '')),
    escapeCsv(String(row.pathname ?? '')),
    row.count,
    row.avg.toFixed(3),
    row.min.toFixed(3),
    row.max.toFixed(3),
  ].join(',')
}

function escapeCsv(value) {
  const stringValue = String(value ?? '')
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

void main().catch((error) => {
  console.error('Vitals rollup failed:', error)
  process.exit(1)
})
