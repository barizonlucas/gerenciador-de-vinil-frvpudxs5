import { supabase } from '@/lib/supabase/client'

export interface MetricCardData {
  widgetOpens7d: number | null
  voteConversion7d: number | null
  voteChangePct7d: number | null
  messagesReceived7d: number | null
  avgFirstReplyTime: number | null
}

export interface ChartDataPoint {
  date: string
  count: number
}

export interface QuickMetricsData {
  cards: MetricCardData
  charts: {
    widgetOpens14d: ChartDataPoint[]
    messages14d: ChartDataPoint[]
  }
}

const formatDateForChart = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export const getQuickMetrics = async (): Promise<QuickMetricsData> => {
  try {
    const [
      widgetOpens7dRes,
      voteConversion7dRes,
      voteChangePct7dRes,
      messagesReceived7dRes,
      avgFirstReplyTimeRes,
      widgetOpens14dRes,
      messages14dRes,
    ] = await Promise.all([
      supabase.rpc('get_quick_metrics_widget_opens_7d').single(),
      supabase.rpc('get_quick_metrics_vote_conversion_7d').single(),
      supabase.rpc('get_quick_metrics_vote_change_pct_7d').single(),
      supabase.rpc('get_quick_metrics_messages_received_7d').single(),
      supabase.rpc('get_quick_metrics_avg_first_reply_time').single(),
      supabase.rpc('get_quick_metrics_widget_opens_chart_14d'),
      supabase.rpc('get_quick_metrics_messages_chart_14d'),
    ])

    const results = {
      widgetOpens7d: widgetOpens7dRes,
      voteConversion7d: voteConversion7dRes,
      voteChangePct7d: voteChangePct7dRes,
      messagesReceived7d: messagesReceived7dRes,
      avgFirstReplyTime: avgFirstReplyTimeRes,
      widgetOpens14d: widgetOpens14dRes,
      messages14d: messages14dRes,
    }

    for (const [key, result] of Object.entries(results)) {
      if (result.error) {
        console.error(`Error fetching quick metric "${key}":`, result.error)
        throw new Error(`Failed to fetch metric: ${key}`)
      }
    }

    const cards: MetricCardData = {
      widgetOpens7d: results.widgetOpens7d.data?.count ?? 0,
      voteConversion7d: results.voteConversion7d.data?.conversion_pct ?? 0,
      voteChangePct7d: results.voteChangePct7d.data?.pct_over_votes ?? 0,
      messagesReceived7d: results.messagesReceived7d.data?.count ?? 0,
      avgFirstReplyTime: results.avgFirstReplyTime.data?.avg_minutes ?? 0,
    }

    const charts = {
      widgetOpens14d: (results.widgetOpens14d.data || []).map((item: any) => ({
        date: formatDateForChart(item.dia),
        count: item.count,
      })),
      messages14d: (results.messages14d.data || []).map((item: any) => ({
        date: formatDateForChart(item.dia),
        count: item.count,
      })),
    }

    return { cards, charts }
  } catch (error) {
    console.error('An error occurred in getQuickMetrics:', error)
    throw new Error('Could not load quick metrics data.')
  }
}
