# Novacki Denúncias

Backend do sistema de denúncias da Novacki, desenvolvido com Node.js, Express e Prisma, com banco MySQL/MariaDB e armazenamento de anexos no Cloudflare R2. Este repositório contém a API; o frontend deve ser executado separadamente.

## Requisitos

- Node.js 22.12 ou superior da linha 22, ou Node.js 24, conforme `package.json`, e npm.
- MySQL/MariaDB acessível, com banco e usuário próprios para desenvolvimento.
- Conta Cloudflare R2, bucket e credenciais com acesso de leitura, escrita e exclusão de objetos.
- ClamAV para executar a verificação de anexos.
- Servidor SMTP somente se as notificações por e-mail forem habilitadas.

Execute os comandos abaixo na raiz do projeto.

## 1. Configurar o ambiente

No PowerShell, para uma instalação nova:

```powershell
Copy-Item .env.example .env
```

No Linux/macOS, use `cp .env.example .env`. Se já existir um `.env`, mantenha-o e acrescente apenas as configurações necessárias a partir do exemplo.

Edite o `.env` e substitua todos os valores `SUBSTITUA`. O arquivo está ignorado pelo Git.

| Configuração | Como preencher |
| --- | --- |
| `DATABASE_URL` e `DB_*` | Mesmos host, porta, usuário, senha e banco. A CLI do Prisma usa a URL; API, seed e worker usam `DB_*`. |
| `ADMIN_PRE_AUTH_SECRET` e `RATE_LIMIT_HMAC_KEY` | Segredos aleatórios independentes; gere um valor para cada variável. O HMAC exige pelo menos 32 caracteres. |
| `REPORT_ENCRYPTION_KEY_V1` | Chave de 32 bytes em Base64, com `REPORT_ENCRYPTION_KEY_VERSION=1`. |
| `R2_*` | Credenciais e bucket reais de desenvolvimento. O módulo exige as quatro variáveis já na inicialização. |
| `SEED_ADMIN_*` | Nome, e-mail e senha do administrador inicial; senha com pelo menos 12 caracteres. |
| `CORS_ORIGINS` | Origem exata do frontend, incluindo protocolo e porta. O exemplo usa `http://localhost:5173`. |

Gere cada segredo de autenticação/HMAC executando este comando separadamente:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Gere a chave de criptografia:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Copie as saídas para as respectivas variáveis. Preserve as chaves de criptografia: dados já criptografados dependem da chave da versão usada na gravação.

## 2. Preparar o banco e instalar dependências

Em uma conexão administrativa com seu MySQL/MariaDB local, crie o banco e o usuário. Troque a senha abaixo pela mesma configurada no `.env`:

```sql
CREATE DATABASE novacki_denuncias CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'novacki'@'127.0.0.1' IDENTIFIED BY 'SUBSTITUA_SENHA_DO_BANCO';
GRANT ALL PRIVILEGES ON novacki_denuncias.* TO 'novacki'@'127.0.0.1';
```

O host da conta deve corresponder à origem da conexão aceita pelo seu servidor. Na `DATABASE_URL`, codifique caracteres especiais da senha como componentes de URL; em `DB_PASS`, mantenha a senha original.

```sh
npm ci
npx prisma migrate deploy
npx prisma db seed
```

O `npm ci` executa `prisma generate` automaticamente e precisa do `.env` configurado antes da instalação. O comando de migração aplica as migrações existentes; use um banco vazio na primeira instalação. Para um banco existente com tabelas, confira o histórico de migrações antes de aplicar a migração inicial.

O seed prepara permissões, papéis, empresa, unidades, equipe e administrador. O usuário novo precisa trocar a senha no primeiro acesso. Executar novamente o seed não redefine a senha de um administrador já existente.

## 3. Iniciar a API

Com reinicialização automática durante o desenvolvimento:

```sh
npm run dev
```

Para executar sem o nodemon:

```sh
npm start
```

A API atende em `http://localhost:3000`, salvo alteração de `PORT`. Não há etapa de build para iniciar este backend.

Em outro terminal PowerShell, confira:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/ready
```

`/health` retorna `{"status":"ok"}` quando o processo responde. `/ready` consulta o banco e retorna `{"status":"ready"}`, ou HTTP 503 se a conexão falhar. Esses endpoints não verificam R2, SMTP ou ClamAV. As rotas de negócio ficam sob `/api/public` e `/api/admin`.

## Worker e integrações opcionais

A API não inicia o worker automaticamente. Para manutenção de sessões e processamento em segundo plano, configure `SYSTEM_WORKER_ENABLED=true` e execute em outro terminal:

```sh
npm run worker
```

Para executar um único ciclo, também com o worker habilitado:

```sh
npm run worker:once
```

O intervalo padrão é 60 segundos. `RETENTION_SCHEDULER_ENABLED` habilita o agendamento de retenção e `RETENTION_EXECUTOR_ENABLED` habilita sua execução. Ambos começam desativados no exemplo; a execução pode remover denúncias e objetos conforme as políticas cadastradas.

Para verificar anexos, disponibilize `clamdscan` no PATH com o daemon ClamAV ativo. Como alternativa, use `CLAMAV_COMMAND=clamscan` e `CLAMAV_MODE=standalone`, com a base de assinaturas instalada. O timeout é controlado por `CLAMAV_TIMEOUT_MS`.

Para e-mails, descomente e preencha `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` e `ADMIN_PANEL_URL`, e defina `EMAIL_NOTIFICATIONS_ENABLED=true`. Normalmente, a porta 465 usa `SMTP_SECURE=true`, enquanto a 587 usa `false` para iniciar com STARTTLS. `GLOBAL_NOTIFICATION_EMAIL` é opcional.

## Testes

Com um `.env` de desenvolvimento/teste preenchido, carregue explicitamente as variáveis ao executar a suíte:

```sh
node --require dotenv/config --test
node --require dotenv/config --test "test/security/*.test.js"
```

Os scripts `npm test` e `npm run test:security` também estão disponíveis quando as variáveis já estão carregadas no ambiente. Use recursos de teste dedicados para verificações que envolvam integrações.

## Configuração em produção

Configure `NODE_ENV=production`, `COOKIE_SECURE=true`, HTTPS e as origens reais em `CORS_ORIGINS`. Mantenha `CORS_ALLOW_LOCALHOST=false`. Se a integração exigir cookies entre sites, use `COOKIE_SAME_SITE=none` junto de HTTPS. Ajuste `TRUST_PROXY` à infraestrutura de proxy usada.

Para banco remoto, configure `DB_SSL=true` e mantenha `DB_SSL_REJECT_UNAUTHORIZED=true`; informe `DB_SSL_CA_PATH` quando necessário. A configuração da CLI Prisma acrescenta `sslaccept=strict` para hosts remotos. Em produção, a senha do banco deve ter pelo menos 16 caracteres. Com notificações habilitadas, `ADMIN_PANEL_URL` deve usar HTTPS.

## Problemas comuns

- **Erro de validação do ambiente:** confira os nomes de campos no log e compare com `.env.example`; não deixe variáveis opcionais descomentadas e vazias.
- **Configuração do Cloudflare R2 incompleta:** preencha todas as variáveis `R2_*` antes de iniciar.
- **Chave de criptografia inválida:** gere 32 bytes em Base64; uma string hexadecimal não é o formato esperado para `REPORT_ENCRYPTION_KEY_V1`.
- **Prisma Client ausente:** execute `npx prisma generate` após instalar as dependências.
- **`/ready` retorna 503:** confira banco, credenciais, rede e TLS; verifique se `DATABASE_URL` e `DB_*` apontam para o mesmo destino.
- **Cookies ou CORS falham localmente:** confira a origem e a porta do frontend, use `COOKIE_SECURE=false` e `COOKIE_SAME_SITE=lax` em HTTP local e envie credenciais nas requisições do frontend.
