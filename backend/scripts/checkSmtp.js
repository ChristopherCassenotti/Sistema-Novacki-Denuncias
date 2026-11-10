"use strict";

const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const fs = require("node:fs");
const path = require("node:path");
const keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS"];
const file = dotenv.parse(fs.readFileSync(path.join(__dirname, "..", ".env")));
const overriddenFields = keys.filter(key => process.env[key] !== undefined && file[key] !== undefined && process.env[key] !== file[key]);
dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });
function sanitize(value) {
    let result = String(value || "");
    const user = process.env.SMTP_USER || "";
    const pass = process.env.SMTP_PASS || "";
    const secrets = [user, pass, Buffer.from(user).toString("base64"), Buffer.from(pass).toString("base64"), Buffer.from("\0" + user + "\0" + pass).toString("base64")];
    for (const secret of secrets.filter(Boolean).sort((a, b) => b.length - a.length)) result = result.split(secret).join("[REDACTED]");
    return result.replace(/[^\s<>@]+@[^\s<>@]+/g, "[EMAIL]").slice(0, 1000);
}
async function main() {
    console.log({ host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, secure: process.env.SMTP_SECURE, overriddenFields });
    const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        requireTLS: process.env.SMTP_SECURE !== "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    });
    try {
        await transport.verify();
        console.log("SMTP autenticado com sucesso. Nenhum e-mail foi enviado.");
    } catch (error) {
        console.error({ code: error.code, responseCode: error.responseCode, command: sanitize(error.command), response: sanitize(error.response), detail: sanitize(error.message) });
        process.exitCode = 1;
    } finally {
        transport.close();
    }
}
main().catch(() => { console.error("Não foi possível executar o diagnóstico SMTP."); process.exitCode = 1; });
