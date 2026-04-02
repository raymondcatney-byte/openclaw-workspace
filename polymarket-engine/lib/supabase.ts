import { createClient } from '@supabase/supabase-js';
import { Market, PriceHistory, Alert } from '@/types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function upsertMarket(market: Market) {
  const { error } = await supabase
    .from('markets')
    .upsert(market, { onConflict: 'condition_id' });
  
  if (error) throw error;
}

export async function insertPriceHistory(price: PriceHistory) {
  const { error } = await supabase
    .from('price_history')
    .insert(price);
  
  if (error) throw error;
}

export async function insertAlert(alert: Omit<Alert, 'id'>) {
  const { error } = await supabase
    .from('alerts')
    .insert(alert);
  
  if (error) throw error;
}

export async function getMarkets(filters: {
  sector?: string;
  min_price?: number;
  max_price?: number;
  min_volume?: number;
  search?: string;
  ending_soon?: boolean;
}) {
  let query = supabase.from('markets').select('*');
  
  if (filters.sector) {
    query = query.eq('sector', filters.sector);
  }
  
  if (filters.min_price !== undefined) {
    query = query.gte('yes_price', filters.min_price);
  }
  
  if (filters.max_price !== undefined) {
    query = query.lte('yes_price', filters.max_price);
  }
  
  if (filters.min_volume) {
    query = query.gte('volume', filters.min_volume);
  }
  
  if (filters.search) {
    query = query.ilike('question', `%${filters.search}%`);
  }
  
  if (filters.ending_soon) {
    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    query = query.lte('end_date', oneDayFromNow).gte('end_date', new Date().toISOString());
  }
  
  const { data, error } = await query.order('volume', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getMarketById(conditionId: string) {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('condition_id', conditionId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getPriceHistory(conditionId: string, days: number = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('condition_id', conditionId)
    .gte('timestamp', since)
    .order('timestamp', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function getAlerts(filters: {
  sector?: string;
  min_severity?: number;
  since?: string;
}) {
  let query = supabase
    .from('alerts')
    .select('*, market:markets(*)');
  
  if (filters.sector) {
    query = query.eq('sector', filters.sector);
  }
  
  if (filters.min_severity) {
    query = query.gte('severity', filters.min_severity);
  }
  
  if (filters.since) {
    query = query.gte('timestamp', filters.since);
  } else {
    // Default to last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('timestamp', yesterday);
  }
  
  const { data, error } = await query.order('timestamp', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getSectorStats() {
  const { data, error } = await supabase
    .from('markets')
    .select('sector, count, avg_volume:volume.avg(), sum_volume:volume.sum()')
    .group('sector');
  
  if (error) throw error;
  return data || [];
}

export async function getRecentAlertsBySector(sector: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { count, error } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('sector', sector)
    .gte('timestamp', today.toISOString());
  
  if (error) throw error;
  return count || 0;
}
