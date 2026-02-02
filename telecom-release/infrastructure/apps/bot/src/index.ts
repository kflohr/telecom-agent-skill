import { Telegraf, Markup } from 'telegraf';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// CONFIG
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.TELECOM_API_URL || 'http://localhost:3000';
const API_TOKEN = process.env.TELECOM_API_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ Missing TELEGRAM_BOT_TOKEN");
  (process as any).exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// HELPERS
const apiRequest = async (path: string, method: string = 'GET', body?: any) => {
    try {
        const res = await fetch(`${API_URL}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Workspace-Token': API_TOKEN || '',
                'X-Actor-Source': 'telegram'
            },
            body: body ? JSON.stringify(body) : undefined
        });
        const data: any = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        return data;
    } catch (e: any) {
        console.error(`API Error [${path}]:`, e.message);
        throw e;
    }
};

// COMMANDS

bot.start((ctx) => {
    ctx.reply(
        "👋 Welcome to TelecomOps Mobile.\n\nI am your field interface for the Control Plane.",
        Markup.keyboard([
            ['📊 Status', '🚨 Approvals'],
            ['📞 Active Calls', '💬 Recent SMS']
        ]).resize()
    );
});

bot.hears('📊 Status', async (ctx) => {
    try {
        ctx.sendChatAction('typing');
        const health = await apiRequest('/v1/health');
        const stats = await apiRequest('/v1/status/recent');
        
        let msg = `✅ *System Online*\n`;
        msg += `DB: ${health.db}\n`;
        msg += `Calls: ${stats.stats.activeCalls}\n`;
        msg += `Approvals Pending: ${stats.stats.pendingApprovals}`;
        
        ctx.replyWithMarkdown(msg);
    } catch (e: any) {
        ctx.reply(`⚠️ Error: ${e.message}`);
    }
});

bot.hears('🚨 Approvals', async (ctx) => {
    try {
        ctx.sendChatAction('typing');
        const approvals = await apiRequest('/v1/approvals/pending');
        
        if (approvals.length === 0) {
            return ctx.reply("✅ No pending approvals.");
        }
        
        for (const app of approvals) {
            const msg = `🛡 *Approval Requested*\n\n` + 
                        `Action: \`${app.action}\`\n` + 
                        `By: ${app.actorLabel}\n` +
                        `ID: \`${app.id}\``;
            
            await ctx.replyWithMarkdown(msg, Markup.inlineKeyboard([
                Markup.button.callback('✅ Approve', `approve:${app.id}`),
                Markup.button.callback('❌ Deny', `deny:${app.id}`)
            ]));
        }
    } catch (e: any) {
        ctx.reply(`⚠️ Error: ${e.message}`);
    }
});

bot.action(/approve:(.+)/, async (ctx) => {
    const id = ctx.match[1];
    try {
        await apiRequest(`/v1/approvals/${id}/decision`, 'POST', { decision: 'approve' });
        await ctx.answerCbQuery("Approved!");
        await ctx.editMessageText(`✅ Request ${id} APPROVED.`);
    } catch (e: any) {
        await ctx.answerCbQuery(`Error: ${e.message}`);
    }
});

bot.action(/deny:(.+)/, async (ctx) => {
    const id = ctx.match[1];
    try {
        await apiRequest(`/v1/approvals/${id}/decision`, 'POST', { decision: 'deny', reason: 'Denied via Telegram' });
        await ctx.answerCbQuery("Denied.");
        await ctx.editMessageText(`❌ Request ${id} DENIED.`);
    } catch (e: any) {
        await ctx.answerCbQuery(`Error: ${e.message}`);
    }
});

bot.launch(() => {
    console.log("🤖 Telecom Bot is listening...");
});

// Enable graceful stop
(process as any).once('SIGINT', () => bot.stop('SIGINT'));
(process as any).once('SIGTERM', () => bot.stop('SIGTERM'));