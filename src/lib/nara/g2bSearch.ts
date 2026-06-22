import type { BidItem } from './types'

const G2B_BID_URLS = [
  'https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoThng',
  'https://apis.data.go.kr/1230000/BidPublicInfoService/getBidPblancListInfoThng'
]

function stableId(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  }
  return `g2b-${Math.abs(hash)}`
}

function itemKey(item: Pick<BidItem, 'url' | 'title' | 'category'>) {
  return `${item.category || ''}|${item.url}|${item.title}`.replace(/\s+/g, ' ').trim().toLowerCase()
}

function yyyymmddhhmm(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`
}

function normalizeServiceKey(key: string) {
  try {
    return key.includes('%') ? decodeURIComponent(key) : key
  } catch {
    return key
  }
}

function asArray(value: any): any[] {
  if (Array.isArray(value)) return value
  if (!value) return []
  return [value]
}

function itemStatus(deadline: string): BidItem['status'] {
  if (!deadline) return 'active'
  const date = new Date(deadline.replace(/\./g, '-').replace(/\//g, '-'))
  if (Number.isNaN(date.getTime())) return 'active'
  return date.getTime() < Date.now() ? 'ended' : 'active'
}

function priceText(item: any) {
  const value = item.asignBdgtAmt || item.presmptPrce || item.rsrvtnPrceRngBgnPrce || ''
  return value ? String(value) : ''
}

function recordUrl(item: any) {
  return item.bidNtceDtlUrl || item.bidNtceUrl || 'https://www.g2b.go.kr/'
}

function parseItems(items: any[], keyword: string): BidItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase()
  return items.filter((item) => {
    if (!normalizedKeyword) return true
    return String(item.bidNtceNm || '').toLowerCase().includes(normalizedKeyword)
  }).map((item) => {
    const title = String(item.bidNtceNm || item.refNo || '나라장터 공고')
    const category = '나라장터 입찰공고'
    const url = recordUrl(item)
    const deadline = String(item.bidClseDt || item.opengDt || '')
    const key = itemKey({ url, title, category })

    return {
      id: stableId(key),
      title,
      company: String(item.ntceInsttNm || item.dminsttNm || '나라장터'),
      price: priceText(item),
      deadline,
      status: itemStatus(deadline),
      url,
      source: 'naramarket' as const,
      createdAt: String(item.bidNtceDt || new Date().toISOString()),
      description: `${keyword} ${Object.values(item).filter(Boolean).join(' ')}`,
      location: String(item.dminsttNm || ''),
      category
    }
  })
}

async function fetchG2bKeyword(keyword: string, serviceKey: string) {
  const today = new Date()
  const past = new Date()
  past.setDate(today.getDate() - 90)

  const params = new URLSearchParams({
    serviceKey: normalizeServiceKey(serviceKey),
    pageNo: '1',
    numOfRows: '100',
    type: 'json',
    inqryDiv: '1',
    inqryBgnDt: yyyymmddhhmm(past),
    inqryEndDt: yyyymmddhhmm(today)
  })

  if (keyword.trim()) params.set('bidNtceNm', keyword.trim())

  let lastError: unknown

  for (const url of G2B_BID_URLS) {
    try {
      const response = await fetch(`${url}?${params.toString()}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(20000)
      })

      const text = await response.text()
      if (!response.ok) throw new Error(`G2B ${response.status}: ${text.slice(0, 120)}`)

      const data = JSON.parse(text)
      const header = data?.response?.header
      if (header?.resultCode && header.resultCode !== '00') {
        throw new Error(header.resultMsg || `G2B resultCode ${header.resultCode}`)
      }

      return parseItems(asArray(data?.response?.body?.items?.item ?? data?.response?.body?.items), keyword)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('나라장터 검색 실패')
}

export async function searchG2bBids(keywords: string[], apiKey?: string): Promise<{ bids: BidItem[]; errors: string[] }> {
  const serviceKey = apiKey || process.env['NARAMARKET_API_KEY'] || process.env['DATA_GO_KR_SERVICE_KEY'] || ''
  if (!serviceKey) {
    return { bids: [], errors: ['나라장터 API 키가 설정되지 않았습니다.'] }
  }

  const merged = new Map<string, BidItem>()
  const errors: string[] = []
  const terms = keywords.length > 0 ? keywords : ['']

  for (const keyword of terms) {
    try {
      const items = await fetchG2bKeyword(keyword, serviceKey)
      items.forEach((item) => merged.set(itemKey(item), item))
    } catch (error) {
      errors.push(`나라장터 ${keyword || '전체'}: ${error instanceof Error ? error.message : '검색 실패'}`)
    }
  }

  return { bids: Array.from(merged.values()), errors }
}
