import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://hadaci.cz'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date()

  // 1. Veřejné hlavní sekce s kanonickou doménou
  const mainRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/vyslech`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/archiv`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/zebricky`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  // 2. Veřejné publikované archivní hádanky s vlastní URL (/hadanka/[id])
  let riddleRoutes: MetadataRoute.Sitemap = []
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })

      // Přísný filtr: pouze aktivní hádanky s datem publikace dnešním nebo starším (žádné budoucí)
      const { data: riddles, error } = await supabase
        .from('riddles')
        .select('id, publish_date')
        .eq('is_active', true)
        .lte('publish_date', todayStr)
        .order('publish_date', { ascending: false })

      if (!error && riddles) {
        riddleRoutes = riddles.map((riddle) => ({
          url: `${BASE_URL}/hadanka/${riddle.id}`,
          lastModified: riddle.publish_date ? new Date(riddle.publish_date) : currentDate,
          changeFrequency: 'monthly',
          priority: 0.6,
        }))
      }
    }
  } catch (err) {
    console.warn('⚠️ Chyba při načítání publikovaných hádanek do sitemap.ts:', err)
  }

  return [...mainRoutes, ...riddleRoutes]
}
