#!/usr/bin/env node
/**
 * Run Supabase migrations
 * Usage: npx ts-node scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration(filename: string) {
  const migrationPath = path.join(
    __dirname,
    '../migrations',
    filename
  )

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8')

  console.log(`Running migration: ${filename}`)
  console.log('---')

  try {
    const { error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error(`Migration failed: ${error.message}`)
      process.exit(1)
    }

    console.log(`✓ Migration completed: ${filename}`)
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
}

async function main() {
  const migrations = [
    '002-add-first-name-to-email-subscribers.sql',
  ]

  for (const migration of migrations) {
    await runMigration(migration)
  }

  console.log('---')
  console.log('✓ All migrations completed successfully')
}

main()
