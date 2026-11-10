"use strict";
const tls = require("node:tls");
const hosts = ["smtp.nvkpe.com.br", "mail.nvkpe.com.br", "mx.nvkpe.com.br", "smtp.novacki.com.br", "mail.novacki.com.br", "mx.novacki.com.br"];
function check(host) {
    return new Promise(resolve => {
        let socket;
        let finished = false;
        const timer = setTimeout(() => finish({ host, status: "TIMEOUT" }), 8000);
        function finish(result) {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            if (socket) socket.destroy();
            resolve(result);
        }
        socket = tls.connect({ host, port: 465, servername: host, rejectUnauthorized: true });
        let greeting = "";
        socket.on("data", chunk => {
            greeting += chunk.toString("utf8");
            if (greeting.includes("\n")) finish({ host, status: /^220[ -]/.test(greeting) ? "TLS_VALIDO_SMTP_DISPONIVEL" : "RESPOSTA_NAO_CONFIRMADA" });
            else if (greeting.length > 4096) finish({ host, status: "RESPOSTA_NAO_CONFIRMADA" });
        });
        socket.on("error", error => finish({ host, status: error.code || "CONNECTION_ERROR" }));
        socket.on("end", () => finish({ host, status: "CONNECTION_CLOSED" }));
    });
}
Promise.all(hosts.map(check)).then(results => {
    console.table(results);
    console.log("Teste sem senha e sem envio de e-mail. Um resultado positivo confirma TLS e serviço SMTP, mas não autenticação da conta.");
});
