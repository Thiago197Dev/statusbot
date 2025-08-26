require("dotenv").config(); // .env einlesen
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// === KONFIGURATION ===
const TOKEN = process.env.DISCORD_TOKEN; // Token jetzt sicher aus .env
const CHANNEL_ID = "1409708738784526477";
const ROLE_AVAILABLE = "1409683743148609666";
const ROLE_OFFDUTY = "1409683872886554737";
const ROLE_BUSY = "1409686604276301934";
let messageId = null;

function getTimestamp() {
    return new Date().toLocaleTimeString("de-DE", { hour12: false });
}

async function updateEmbed() {
    const guild = client.guilds.cache.first();
    if (!guild) return console.log("❌ Keine Guild gefunden.");

    await guild.members.fetch(); // Alle Mitglieder laden

    // Rollen abrufen
    const roleAvailable = guild.roles.cache.get(ROLE_AVAILABLE);
    const roleOffDuty   = guild.roles.cache.get(ROLE_OFFDUTY);
    const roleBusy      = guild.roles.cache.get(ROLE_BUSY);

    const channel = guild.channels.cache.get(CHANNEL_ID);
    if (!channel) return console.log("❌ Channel konnte nicht gefunden werden.");

    // Mitglieder pro Rolle sammeln (Nicknames mit Fallback Username)
    const available = roleAvailable
        ? roleAvailable.members.map(m => m.nickname || m.user.username)
        : ["⚠️ Rolle nicht gefunden"];

    const offduty = roleOffDuty
        ? roleOffDuty.members.map(m => m.nickname || m.user.username)
        : ["⚠️ Rolle nicht gefunden"];

    const busy = roleBusy
        ? roleBusy.members.map(m => m.nickname || m.user.username)
        : ["⚠️ Rolle nicht gefunden"];

    // Debug-Ausgaben ins Terminal
    console.log(`[${getTimestamp()}] === DEBUG START ===`);
    console.log("Gefundene Guilds:", client.guilds.cache.map(g => g.name));
    console.log("Channel gefunden:", channel ? channel.name : "❌ NICHT gefunden");
    console.log("Rolle Verfügbar:", roleAvailable ? roleAvailable.name : "❌ NICHT gefunden");
    console.log("Rolle Außer Dienst:", roleOffDuty ? roleOffDuty.name : "❌ NICHT gefunden");
    console.log("Rolle Beschäftigt:", roleBusy ? roleBusy.name : "❌ NICHT gefunden");
    console.log("Mitglieder verfügbar (Nicknames):", available);
    console.log("Mitglieder außer Dienst (Nicknames):", offduty);
    console.log("Mitglieder beschäftigt (Nicknames):", busy);
    console.log(`[${getTimestamp()}] === DEBUG ENDE ===`);

    const availableText = available.length ? available.join(", ") : "❌ Keine";
    const offdutyText   = offduty.length ? offduty.join(", ") : "❌ Keine";
    const busyText      = busy.length ? busy.join(", ") : "❌ Keine";

    // Embed erstellen
    const embed = new EmbedBuilder()
        .setTitle("⚖️ Anwalt Status Übersicht")
        .addFields(
            { name: "✅ Verfügbar", value: availableText, inline: false },
            { name: "💤 Außer Dienst", value: offdutyText, inline: false },
            { name: "🔴 Beschäftigt", value: busyText, inline: false }
        )
        .setColor(0x2ecc71)
        .setTimestamp();

    // Nachricht bearbeiten oder neu posten
    if (messageId) {
        try {
            const msg = await channel.messages.fetch(messageId);
            await msg.edit({ embeds: [embed] });
            console.log(`[${getTimestamp()}] ✅ Embed erfolgreich aktualisiert.`);
            return;
        } catch (err) {
            console.log("⚠️ Konnte alte Nachricht nicht bearbeiten, poste neu.");
        }
    }

    // Neue Nachricht posten
    const sent = await channel.send({ embeds: [embed] });
    messageId = sent.id;
    console.log(`[${getTimestamp()}] 🆕 Neue Embed-Nachricht erstellt.`);
}

client.on("ready", async () => {
    console.log(`✅ Eingeloggt als ${client.user.tag}`);

    const guild = client.guilds.cache.first();
    const channel = guild.channels.cache.get(CHANNEL_ID);

    if (channel) {
        // Alle alten Nachrichten im Channel löschen
        await channel.bulkDelete(100).catch(() => {
            console.log("⚠️ Konnte alte Nachrichten nicht löschen.");
        });
    }

    // Neue Embed-Nachricht posten
    await updateEmbed();

    // Alle 30 Sekunden aktualisieren
    setInterval(updateEmbed, 30 * 1000);
});

client.login(TOKEN);
