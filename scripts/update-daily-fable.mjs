#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libraryPath = path.join(root, 'src', 'data', 'daily-fables.json');
const historyPath = path.join(root, 'src', 'data', 'daily-fable-history.json');
const now = new Date();
const romeParts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false
}).formatToParts(now).map(({ type, value }) => [type, value]));
const dateKey = `${romeParts.year}-${romeParts.month}-${romeParts.day}`;

if (process.env.GITHUB_EVENT_NAME === 'schedule' && romeParts.hour !== '07') {
  console.log(`Skipping scheduled fable update outside 07:40 Europe/Rome (local ${dateKey} ${romeParts.hour}:40)`);
  process.exit(0);
}

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const writeJson = async (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`);

const library = await readJson(libraryPath);
const history = await readJson(historyPath);
const entries = Array.isArray(history.entries) ? [...history.entries] : [];
const usedIds = new Set(entries.map((entry) => entry.id).filter(Boolean));
const usedTitles = new Set(library.filter((item) => usedIds.has(item.id)).map((item) => item.title));

const normalizedLibrary = library.map((item, index) => ({
  ...item,
  id: item.id || `fable-${String(index + 1).padStart(3, '0')}`
}));
const libraryChanged = normalizedLibrary.some((item, index) => item.id !== library[index].id);

if (entries.some((entry) => entry.date === dateKey)) {
  if (libraryChanged) await writeJson(libraryPath, normalizedLibrary);
  console.log(`Fable already assigned for ${dateKey}; no repeat created.`);
  process.exit(0);
}

const offlineSeeds = [
  { field: '经济学', concept: '沉没成本', object: '沉船上的铜币', explanation: '沉没成本是已经发生且无法收回的投入。理性的选择应比较未来的增量收益与增量成本，而不是为了证明过去没有错继续投入。', application: '做项目时把已经花掉的钱、时间和面子单独列出，再问下一步是否仍值得投入。' },
  { field: '心理学', concept: '损失厌恶', object: '集市上的破伞', explanation: '损失厌恶指人们对损失的痛苦通常大于同等收益带来的快乐，因此会高估保住已有东西的价值。', application: '判断一个方向时分别写出继续和停止的机会成本，避免只因为害怕失去已有投入而坚持。' },
  { field: '社会学', concept: '社会证明', object: '剧院门口的空椅子', explanation: '社会证明是人在不确定时用他人的行为推断什么值得选择。它能降低决策成本，也会把早期的偶然选择放大成潮流。', application: '看平台热度时同时寻找真实使用证据，不把围观人数直接当成需求强度。' },
  { field: '计算机科学', concept: '局部最优陷阱', object: '山谷里的近路', explanation: '局部最优是在每一步都选择眼前最好的方案，却可能因此错过需要暂时退让才能到达的全局更优解。', application: '优化产品流程时保留一个观察全局目标的指标，定期检查局部改进是否损害整体体验。' },
  { field: '生物学', concept: '生态位分化', object: '森林里的三口井', explanation: '生态位分化描述相似物种通过时间、空间或资源偏好的差异减少直接竞争，从而共同存在。', application: '寻找市场机会时先研究不同用户场景，而不是只在同一卖点上和竞争者比价格。' },
  { field: '教育科学', concept: '认知负荷', object: '书院里的长梯', explanation: '认知负荷是工作记忆在处理新信息时承受的负担。无关复杂度过高会挤压真正学习所需的注意力。', application: '做教程或商品页面时减少无关选择，把关键步骤分段呈现并在需要处提供示例。' },
  { field: '博弈论', concept: '囚徒困境', object: '城门下的两把锁', explanation: '囚徒困境说明个体理性选择可能导致双方都更差的结果，除非规则、信任或重复互动改变了激励。', application: '设计合作方案时明确承诺、违约代价和重复合作机制，让诚实行动成为可持续选择。' },
  { field: '经济学', concept: '价格歧视', object: '港口的三张船票', explanation: '价格歧视是在成本相近时根据不同顾客的支付意愿或使用情境收取不同价格。它可能扩大服务覆盖，也可能引发公平争议。', application: '设计收费模式时把不同客户真正获得的价值和服务成本拆开验证，不只复制竞品价格。' },
  { field: '心理学', concept: '峰终定律', object: '温泉里的最后一盏灯', explanation: '峰终定律指出，人们回忆一段体验时往往更受最强烈的时刻和结尾影响，而不是平均体验的每一分钟。', application: '改善用户旅程时重点设计关键高峰与结束动作，同时修补会造成强烈负面记忆的节点。' },
  { field: '统计学', concept: '辛普森悖论', object: '两条河的渔网', explanation: '辛普森悖论指分组数据中的趋势合并后可能反转，原因通常是各组规模或结构不同。', application: '比较渠道、市场或产品表现时先分层看数据，再决定是否可以汇总成一个结论。' },
  { field: '管理学', concept: '探索与利用', object: '农夫的两块田', explanation: '探索与利用描述在已知有效方案上继续投入，与尝试未知方案之间的资源分配张力。只利用会停滞，只探索则难以收获。', application: '安排工作时为稳定收入和新方向分别设预算与时间窗口，不让短期任务吞掉全部试验空间。' },
  { field: '设计研究', concept: '可供性', object: '没有把手的门', explanation: '可供性是物体形态和环境线索向使用者暗示可采取的动作。好的线索能减少说明文字，错误线索会制造犹豫。', application: '评审界面和产品原型时观察用户第一眼会做什么，而不是只听他们事后如何解释。' }
];
const places = ['港口', '陶坊', '夜市', '温室', '灯塔', '车站', '水渠', '剧院', '雪地', '钟楼', '果园', '工坊'];
const actors = ['一个刚接手铺子的学徒', '一位负责渡船的老人', '一群互相竞争的商贩', '守着实验记录的园丁', '负责修理机器的工匠', '每天观察顾客的店主'];

const generateOfflineFable = (sequence, existingTitles) => {
  const seed = offlineSeeds[sequence % offlineSeeds.length];
  const place = places[Math.floor(sequence / offlineSeeds.length) % places.length];
  const actor = actors[Math.floor(sequence / (offlineSeeds.length * places.length)) % actors.length];
  const baseTitle = `${place}里的${seed.object}`;
  let title = baseTitle;
  let suffix = 1;
  while (existingTitles.has(title)) title = `${baseTitle}（新的一天 ${suffix++}）`;
  return {
    id: `fable-${dateKey}`,
    field: seed.field,
    concept: seed.concept,
    title,
    story: [
      `${place}里，${actor}遇到一个看似简单的难题。大家都用最顺手的办法处理它，因为昨天这样做还没有出问题。`,
      `几天后，环境悄悄改变：一个小小的限制让原来的办法开始互相牵制。有人只盯着眼前的结果，有人把被忽略的线索记在墙上。`,
      `等到问题真正显露时，后者没有急着证明自己早就正确，而是换了一个看问题的角度。天亮以后，大家发现那条被忽略的线索，竟然比争论谁的办法更快更有用。`
    ],
    reveal: `${place}里的故事讲的是${seed.concept}：${seed.explanation}`,
    explanation: seed.explanation,
    application: seed.application,
    keywords: [seed.concept, seed.field, '观察与验证'],
    createdAt: now.toISOString(),
    generatedBy: 'offline-library'
  };
};

const generateWithOpenAI = async (sequence, existingTitles) => {
  if (!process.env.OPENAI_API_KEY) return null;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      input: `你是中文学术寓言编辑。请创作第 ${sequence + 1} 则全新的研究生水平概念寓言。概念可来自科技、教育、经济学、生物学、博弈论、心理学或设计研究。故事要间接，读者接近结尾才隐约意识到概念；之后给出正式解释和给设计师/创业者的观察。不能重复以下已用标题：${JSON.stringify([...existingTitles].slice(-120))}。只返回 JSON，不要 Markdown。`,
      text: { format: { type: 'json_schema', name: 'daily_fable', strict: true, schema: { type: 'object', properties: { field: { type: 'string' }, concept: { type: 'string' }, title: { type: 'string' }, story: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 }, reveal: { type: 'string' }, explanation: { type: 'string' }, application: { type: 'string' }, keywords: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 } }, required: ['field', 'concept', 'title', 'story', 'reveal', 'explanation', 'application', 'keywords'], additionalProperties: false } } }
    })
  });
  if (!response.ok) throw new Error(`OpenAI ${response.status}`);
  const body = await response.json();
  const text = body.output_text || body.output?.flatMap((part) => part.content || []).find((part) => part.text)?.text;
  const parsed = JSON.parse(text);
  if (!parsed.title || !Array.isArray(parsed.story) || parsed.story.length < 3) throw new Error('generated fable is incomplete');
  const title = existingTitles.has(parsed.title) ? `${parsed.title}（${dateKey}）` : parsed.title;
  return { ...parsed, title, id: `fable-${dateKey}`, createdAt: now.toISOString(), generatedBy: 'openai' };
};

let next = normalizedLibrary.find((item) => !usedIds.has(item.id));
if (!next) {
  try {
    next = await generateWithOpenAI(entries.length, usedTitles);
  } catch (error) {
    console.warn(`OpenAI fable generation skipped: ${error.message}`);
  }
  if (!next) next = generateOfflineFable(entries.length, usedTitles);
  normalizedLibrary.push(next);
}

if (usedIds.has(next.id) || usedTitles.has(next.title)) throw new Error(`Duplicate fable rejected: ${next.id} / ${next.title}`);
entries.push({ date: dateKey, id: next.id });
await writeJson(libraryPath, normalizedLibrary);
await writeJson(historyPath, { version: 1, entries });
console.log(`Assigned unique fable ${next.id} to ${dateKey}; library size=${normalizedLibrary.length}`);
