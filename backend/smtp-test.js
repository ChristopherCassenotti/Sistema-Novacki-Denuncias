require("dotenv").config();

const nodemailer =
    require("nodemailer");


async function main() {
    const transporter =
        nodemailer.createTransport({
            host:
                process.env.SMTP_HOST,

            port:
                Number(
                    process.env.SMTP_PORT
                ),

            secure:
                String(
                    process.env.SMTP_SECURE
                ).toLowerCase() ===
                "true",

            auth: {
                user:
                    process.env.SMTP_USER,

                pass:
                    process.env.SMTP_PASS,
            },

            logger:
                true,

            debug:
                true,
        });


    console.log(
        "Testando conexão SMTP..."
    );


    await transporter.verify();


    console.log(
        "SMTP autenticado com sucesso."
    );


    const result =
        await transporter.sendMail({
            from:
                process.env.SMTP_FROM,

            /*
             * Para o primeiro teste,
             * mande para você mesmo.
             */
            to:
                process.env.SMTP_USER,

            subject:
                "Teste SMTP - Canal de Denúncias",

            text:
                "Se você recebeu este e-mail, o SMTP da Hostinger está funcionando.",
        });


    console.log(
        "E-mail enviado:"
    );

    console.log(
        result.messageId
    );
}


main()
    .catch(
        (error) => {
            console.error(
                "ERRO SMTP:"
            );

            console.error({
                name:
                    error.name,

                code:
                    error.code,

                command:
                    error.command,

                response:
                    error.response,

                responseCode:
                    error.responseCode,

                message:
                    error.message,
            });

            process.exit(1);
        }
    );