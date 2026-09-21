#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'src', 'data', 'daily-feed.json');
const now = new Date();
const weekdayBanners = [
  { key: 'Sun', label: '周日', image: 'images/weekday-hero-07.png' },
  { key: 'Mon', label: '周一', image: 'images/daily-hero-01.png' },
  { key: 'Tue', label: '周二', image: 'images/daily-hero-02.png' },
  { key: 'Wed', label: '周三', image: 'images/daily-hero-03.png' },
  { key: 'Thu', label: '周四', image: 'images/weekday-hero-04.png' },
  { key: 'Fri', label: '周五', image: 'images/weekday-hero-05.png' },
  { key: 'Sat', label: '周六', image: 'images/weekday-hero-06.png' }
];
const localWeekday = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short' }).format(now);
const weekdayBanner = weekdayBanners.find((banner) => banner.key === localWeekday) || weekdayBanners[1];
const heroImage = weekdayBanner.image;
const weekdayLabel = weekdayBanner.label;
if (process.env.GITHUB_EVENT_NAME === 'schedule') {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', hour12: false }).formatToParts(now).map(({ type, value }) => [type, value]));
  if (parts.hour !== '07') {
    console.log(`Skipping scheduled run outside 07:40 Europe/Rome (local ${parts.weekday} ${parts.hour}:40)`);
    process.exit(0);
  }
}

const sources = [
  { name: 'TechCrunch', tag: '科技 · 全球', url: 'https://techcrunch.com/feed/' },
  { name: 'The Verge', tag: '科技 · 全球', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'Design Milk', tag: '工业设计 · 全球', url: 'https://design-milk.com/feed/' },
  { name: 'Designboom', tag: '工业设计 · 全球', url: 'https://www.designboom.com/feed/' },
  { name: 'MIT Technology Review', tag: 'AI 技术 · 全球', url: 'https://www.technologyreview.com/feed/' },
  { name: 'Retail Dive', tag: '电商 · 欧洲 / 美国', url: 'https://www.retaildive.com/feeds/news/' },
  { name: 'Social Media Today', tag: '自媒体 · 全球', url: 'https://www.socialmediatoday.com/rss.xml' },
  { name: 'Rest of World', tag: '商业 · 全球', url: 'https://restofworld.org/feed/' },
  { name: 'Bing News · 淘宝电商', tag: '电商 · 中国', url: 'https://www.bing.com/news/search?q=%E6%B7%98%E5%AE%9D+%E7%94%B5%E5%95%86&format=rss&setlang=zh-CN' },
  { name: 'Bing News · 抖音小红书', tag: '自媒体 · 中国', url: 'https://www.bing.com/news/search?q=%E6%8A%96%E9%9F%B3+%E5%B0%8F%E7%BA%A2%E4%B9%A6&format=rss&setlang=zh-CN' },
  { name: 'Bing News · Amazon TikTok', tag: '电商 · 欧洲 / 东南亚', url: 'https://www.bing.com/news/search?q=Amazon+TikTok+commerce&format=rss&setlang=en-US' },
  { name: 'Bing News · 日韩设计', tag: '设计 · 日韩', url: 'https://www.bing.com/news/search?q=%E6%97%A5%E9%9F%A9+%E8%AE%BE%E8%AE%A1+%E6%B6%88%E8%B4%B9&format=rss&setlang=zh-CN' },
  { name: 'Bing News · 工业设计', tag: '工业设计 · 中国 / 全球', url: 'https://www.bing.com/news/search?q=%E5%B7%A5%E4%B8%9A%E8%AE%BE%E8%AE%A1+%E4%BA%A7%E5%93%81%E8%AE%BE%E8%AE%A1&format=rss&setlang=zh-CN' },
  { name: 'Bing News · AI 技术', tag: 'AI 技术 · 中国 / 全球', url: 'https://www.bing.com/news/search?q=AI+%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD+%E6%8A%80%E6%9C%AF&format=rss&setlang=zh-CN' },
  { name: 'Bing News · 中国官方', tag: '官方 · 中国', url: 'https://www.bing.com/news/search?q=site%3Anews.cn+OR+site%3Agov.cn+%E4%B8%AD%E5%9B%BD&format=rss&setlang=zh-CN' },
  { name: '新华网 · 时政', tag: '官方 · 中国', url: 'https://www.xinhuanet.com/politics/news_politics.xml' },
  { name: '新华网 · 国内', tag: '官方 · 中国', url: 'https://www.xinhuanet.com/local/news_province.xml' },
  { name: '知乎热榜', tag: '高分内容 · 知乎', url: 'https://www.zhihu.com/api/v4/search/hot_search', format: 'zhihu-hot' },
  { name: 'Reddit · Technology', tag: '科技 · Reddit', url: 'https://www.reddit.com/r/technology/top/.rss?t=day' }
];

const decode = (value = '') => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/\s+/g, ' ')
  .trim();

const field = (block, name) => {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return decode(match?.[1] || '');
};

const extractBingDestination = (value = '') => {
  try {
    const parsed = new URL(value);
    const target = parsed.searchParams.get('url');
    return target ? decodeURIComponent(target) : value;
  } catch {
    return value;
  }
};

const parseFeed = (xml, source) => {
  const blocks = [...xml.matchAll(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi)].map((m) => m[0]);
  return blocks.map((block) => {
    const atomLink = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || '';
    const link = extractBingDestination(field(block, 'link') || atomLink);
    const title = field(block, 'title');
    const encodedContent = field(block, 'content:encoded') || field(block, 'encoded') || field(block, 'content');
    const description = field(block, 'description') || field(block, 'summary') || encodedContent;
    const articleText = (encodedContent || description || title).replace(/\s+/g, ' ').trim().slice(0, 6000);
    const inlineDate = block.match(/(?:^|>)([A-Z][a-z]{2},\s?\d{1,2}-[A-Z][a-z]{2}-\d{4}\s+\d{2}:\d{2}:\d{2}\s+GMT)(?:<|$)/i)?.[1] || '';
    const publishedAt = field(block, 'pubDate') || field(block, 'published') || field(block, 'updated') || inlineDate || now.toISOString();
    return { title, link, description, articleText, publishedAt, sourceName: source.name, tag: source.tag };
  }).filter((item) => item.title && item.link);
};

const extractArticleText = (html = '') => {
  const jsonBodies = [...html.matchAll(/"articleBody"\s*:\s*"((?:\\.|[^"\\])*)"/gi)].map((match) => {
    try { return JSON.parse(`"${match[1]}"`); } catch { return ''; }
  }).filter((value) => value.length > 200);
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || html;
  const text = decode(article
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<(?:br|p|div|li|h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<\/[^>]+>/g, '\n'));
  return [...jsonBodies, text].sort((a, b) => b.length - a.length)[0] || '';
};

const hydrateArticle = async (item) => {
  const current = clean(item.articleText || item.description || item.title, 6000);
  if (!item.link || current.length >= 700 || item.sourceName === '知乎热榜') return item;
  try {
    const response = await fetch(item.link, { headers: { 'user-agent': 'Mozilla/5.0 JianwenDailyBrief/1.0' }, signal: AbortSignal.timeout(10000) });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return item;
    const extracted = extractArticleText(await response.text());
    if (extracted.length > Math.max(current.length + 160, 500)) return { ...item, articleText: extracted.slice(0, 6000) };
  } catch (error) {
    console.warn(`article body skipped: ${item.title} (${error.message})`);
  }
  return item;
};

const hydrateArticles = async (items) => {
  const hydrated = [];
  for (let index = 0; index < items.length; index += 4) {
    hydrated.push(...await Promise.all(items.slice(index, index + 4).map(hydrateArticle)));
  }
  return hydrated;
};

const parseZhihuHot = (payload, source) => (payload?.hot_search_queries || []).map((item) => ({
  title: item.query || item.real_query,
  link: `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(item.query || item.real_query || '')}`,
  description: `知乎热榜热度 ${item.hot_show || item.hot || '—'}。`,
  articleText: `知乎热榜问题：${item.query || item.real_query || ''}；热度：${item.hot_show || item.hot || '—'}。`,
  publishedAt: now.toISOString(),
  sourceName: source.name,
  tag: source.tag,
  score: item.hot || 0
})).filter((item) => item.title && item.link);

const fetchSource = async (source) => {
  try {
    const response = await fetch(source.url, { headers: { 'user-agent': 'JianwenDailyBrief/1.0' }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    if (source.format === 'zhihu-hot') return parseZhihuHot(await response.json(), source);
    return parseFeed(await response.text(), source);
  } catch (error) {
    console.warn(`source skipped: ${source.name} (${error.message})`);
    return [];
  }
};

const clean = (value, max = 180) => value.replace(/\s+/g, ' ').trim().slice(0, max);
const unique = (items) => {
  const seenLinks = new Set();
  const seenTitles = new Set();
  return items.filter((item) => {
    const linkKey = (item.link || item.sourceUrl || '').split('#')[0].replace(/\/+$/, '').toLowerCase();
    const titleKey = item.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
    if (seenLinks.has(linkKey) || seenTitles.has(titleKey)) return false;
    seenLinks.add(linkKey);
    seenTitles.add(titleKey);
    return true;
  });
};

const choose = (items) => {
  const freshnessCutoff = now.getTime() - (45 * 24 * 60 * 60 * 1000);
  const fresh = items.filter((item) => {
    const time = Date.parse(item.publishedAt);
    return !Number.isFinite(time) || time >= freshnessCutoff;
  });
  const ranked = [...fresh].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const selected = [];
  const sourceCounts = new Map();
  for (const item of ranked) {
    if (sourceCounts.has(item.sourceName)) continue;
    selected.push(item);
    sourceCounts.set(item.sourceName, 1);
    if (selected.length === 15) return selected;
  }
  for (const item of ranked) {
    const count = sourceCounts.get(item.sourceName) || 0;
    if (selected.includes(item)) continue;
    if (count >= 2) continue;
    selected.push(item);
    sourceCounts.set(item.sourceName, count + 1);
    if (selected.length === 15) break;
  }
  for (const item of ranked) {
    if (selected.includes(item)) continue;
    selected.push(item);
    if (selected.length === 15) break;
  }
  return selected;
};

const summarizeWithOpenAI = async (items) => {
  if (!process.env.OPENAI_API_KEY || !items.length) return items;
  const payload = items.map((item, index) => ({ index, title: item.title, description: clean(item.desc || item.description || item.articleText || item.title, 600), tag: item.tag }));
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      input: `你是中文商业资讯编辑。把以下新闻逐条整理成适合设计师和创业者阅读的中文摘要。只返回 JSON 数组，每项包含 index、desc、why；desc 不超过 70 个汉字，why 不超过 55 个汉字。不要虚构原文没有的事实。\n${JSON.stringify(payload)}`,
      text: { format: { type: 'json_schema', name: 'digest', strict: true, schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { index: { type: 'integer' }, desc: { type: 'string' }, why: { type: 'string' } }, required: ['index', 'desc', 'why'], additionalProperties: false } } }, required: ['items'], additionalProperties: false } } }
    })
  });
  if (!response.ok) throw new Error(`OpenAI ${response.status}`);
  const body = await response.json();
  const text = body.output_text || body.output?.flatMap((part) => part.content || []).find((part) => part.text)?.text;
  const parsed = JSON.parse(text);
  return items.map((item, index) => ({ ...item, desc: parsed.items?.[index]?.desc || item.desc || clean(item.articleText || item.title), why: parsed.items?.[index]?.why || '' }));
};

const translateToChinese = async (text) => {
  const value = clean(text || '');
  const chineseChars = (value.match(/[\u3400-\u9fff]/g) || []).length;
  const latinChars = (value.match(/[A-Za-z]/g) || []).length;
  if (!value || (chineseChars >= 4 && chineseChars >= latinChars)) return value;
  const providers = [
    async () => {
      const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(value)}`;
      const response = await fetch(endpoint, { headers: { 'user-agent': 'Mozilla/5.0 JianwenDailyBrief/1.0' }, signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`Google translation ${response.status}`);
      const payload = await response.json();
      return (payload?.[0] || []).map((part) => part?.[0] || '').join('').trim();
    },
    async () => {
      const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(value)}&langpair=en|zh-CN`;
      const response = await fetch(endpoint, { headers: { 'user-agent': 'JianwenDailyBrief/1.0' }, signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`MyMemory translation ${response.status}`);
      const payload = await response.json();
      if (payload?.responseStatus && payload.responseStatus !== 200) throw new Error(`MyMemory translation ${payload.responseStatus}`);
      return clean(payload?.responseData?.translatedText || '');
    }
  ];
  let lastError = 'translation failed';
  for (const provider of providers) {
    try {
      const translated = await provider();
      if (!translated) throw new Error('translation returned empty text');
      return translated;
    } catch (error) {
      lastError = error.message;
    }
  }
  throw new Error(lastError);
};

const translateItems = async (items) => {
  let complete = true;
  const translated = [];
  for (const item of items) {
    try {
      translated.push({ ...item, title: await translateToChinese(item.title), desc: await translateToChinese(item.desc) });
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.warn(`translation skipped: ${item.title} (${error.message})`);
      complete = false;
      translated.push({
        ...item,
        title: item.title,
        desc: item.desc || clean(item.articleText || item.title)
      });
    }
  }
  return { items: translated, complete };
};

const feeds = (await Promise.all(sources.map(fetchSource))).flat();
const feedPool = unique(feeds).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 60);
const hydratedPool = await hydrateArticles(feedPool);
const uniqueHydratedPool = unique(hydratedPool);
const readablePool = uniqueHydratedPool.filter((item) => (item.articleText || item.description || '').length >= 300);
let selected = choose(readablePool.length >= 15 ? readablePool : uniqueHydratedPool);
if (selected.length < 15) {
  const previous = JSON.parse(await readFile(output, 'utf8'));
  selected = [...selected, ...(previous.items || []).filter((item) => item.sourceName === '示例内容')].slice(0, 15);
}
if (!selected.length) throw new Error('No feed items were collected and no fallback is available');
selected = await hydrateArticles(selected);

let enriched = selected.map((item, index) => ({
  id: `${now.toISOString().slice(0, 10)}-${String(index + 1).padStart(2, '0')}`,
  title: clean(item.title, 90),
  tag: item.tag,
  desc: clean(item.description || item.title),
  articleText: clean(item.articleText || item.description || item.title, 6000),
  sourceName: item.sourceName,
  sourceUrl: item.link,
  publishedAt: new Date(item.publishedAt).toISOString().slice(0, 10)
}));
let translationComplete = false;
try {
  enriched = await summarizeWithOpenAI(enriched);
  translationComplete = Boolean(process.env.OPENAI_API_KEY);
} catch (error) {
  console.warn(`summary skipped: ${error.message}`);
}
const needsChinesePass = enriched.some((item) => !/[\u3400-\u9fff]/.test(item.title) || !/[\u3400-\u9fff]/.test(item.desc));
if (!process.env.OPENAI_API_KEY || !translationComplete || needsChinesePass) {
  const result = await translateItems(enriched);
  enriched = result.items;
  translationComplete = result.complete;
}
enriched = unique(enriched);

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ generatedAt: now.toISOString(), timezone: 'Europe/Rome', status: translationComplete ? 'live' : 'live-raw', heroImage, weekdayLabel, items: enriched }, null, 2)}\n`);
console.log(`Wrote ${enriched.length} items to ${path.relative(root, output)}`);
