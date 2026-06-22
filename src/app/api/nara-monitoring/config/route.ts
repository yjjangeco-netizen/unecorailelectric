import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { naraConfigManager } from '@/lib/nara/config'

export const dynamic = 'force-dynamic'

const CONFIG_KEY = 'nara-monitoring'
const DEFAULT_CONFIG = {
  keywords: ['전기', '전력', '케이블', '변압기'],
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  naraMarketApiKey: '',
  checkInterval: 30,
  naraCronInitialized: false
}

type MonitoringConfig = typeof DEFAULT_CONFIG

function normalizeConfig(value: any): MonitoringConfig {
  const keywords = Array.isArray(value?.keywords)
    ? value.keywords.map((keyword: unknown) => String(keyword).trim()).filter(Boolean)
    : DEFAULT_CONFIG.keywords

  return {
    keywords: keywords.length > 0 ? keywords : DEFAULT_CONFIG.keywords,
    telegramEnabled: Boolean(value?.telegramEnabled),
    telegramBotToken: String(value?.telegramBotToken || ''),
    telegramChatId: String(value?.telegramChatId || ''),
    naraMarketApiKey: String(value?.naraMarketApiKey || ''),
    checkInterval: Math.min(300, Math.max(10, Number(value?.checkInterval) || DEFAULT_CONFIG.checkInterval)),
    naraCronInitialized: Boolean(value?.naraCronInitialized)
  }
}

function isMissingSettingsTable(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false
  const message = error.message || ''
  return error.code === 'PGRST205' || message.includes('app_settings') || message.includes('schema cache')
}

function getRuntimeConfig(): MonitoringConfig {
  const current = naraConfigManager.getAll()
  return normalizeConfig({
    keywords: current.keywords,
    telegramEnabled: current.enableTelegramNotifications,
    telegramBotToken: current.telegramBotToken,
    telegramChatId: current.telegramChatId,
    naraMarketApiKey: current.naramarketApiKey,
    checkInterval: DEFAULT_CONFIG.checkInterval
  })
}

function applyNaraRuntimeConfig(config: MonitoringConfig) {
  naraConfigManager.update({
    keywords: config.keywords,
    enableTelegramNotifications: config.telegramEnabled,
    telegramBotToken: config.telegramBotToken,
    telegramChatId: config.telegramChatId,
    naramarketApiKey: config.naraMarketApiKey
  })
}

async function readNaraStoredConfig() {
  const { data, error } = await supabaseServer
    .from('app_settings')
    .select('value')
    .eq('key', CONFIG_KEY)
    .maybeSingle()

  if (error) {
    const setupRequired = isMissingSettingsTable(error)
    return {
      config: setupRequired ? getRuntimeConfig() : DEFAULT_CONFIG,
      setupRequired,
      warning: setupRequired
        ? 'app_settings 테이블이 없어 현재 실행 설정으로만 반영됩니다.'
        : error.message
    }
  }

  return { config: normalizeConfig(data?.value || DEFAULT_CONFIG), setupRequired: false }
}

export async function GET(_request: NextRequest) {
  const result = await readNaraStoredConfig()
  applyNaraRuntimeConfig(result.config)

  return NextResponse.json({
    ...result,
    setupSql: result.setupRequired ? 'database/create_app_settings.sql' : undefined
  })
}

export async function PUT(request: NextRequest) {
  try {
    const config = normalizeConfig(await request.json())
    applyNaraRuntimeConfig(config)

    const { error } = await supabaseServer
      .from('app_settings')
      .upsert({
        key: CONFIG_KEY,
        value: config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    if (error) {
      if (isMissingSettingsTable(error)) {
        return NextResponse.json({
          config,
          setupRequired: true,
          warning: 'app_settings 테이블이 없어 현재 실행 설정으로만 반영했습니다. 영구 저장하려면 database/create_app_settings.sql을 실행하세요.',
          setupSql: 'database/create_app_settings.sql'
        })
      }

      return NextResponse.json({
        error: 'NARA 설정 저장에 실패했습니다.',
        details: error.message,
        setupSql: 'database/create_app_settings.sql'
      }, { status: 500 })
    }

    return NextResponse.json({ config, setupRequired: false })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'NARA 설정 저장 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
