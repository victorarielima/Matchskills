# Azure App **2. Startup Command na Azure:**
```bash
chmod +x startup.sh && ./startup.sh
```

**Importante:** O script `startup.sh` usa `npm run start:linux` que é específico para Linux, enquanto `npm start` usa `cross-env` para compatibilidade Windows.ice - Linux Configuration

## Configurações específicas necessárias para Azure Linux:

### 1. **Variáveis de Ambiente na Azure:**
```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=sua_connection_string_postgresql
SESSION_SECRET=seu_session_secret_seguro
```

### 2. **Startup Command na Azure:**
```bash
chmod +x startup.sh && ./startup.sh
```

### 3. **Stack Settings:**
- **Runtime Stack**: Node.js 18+ LTS
- **Platform**: Linux
- **Build Tool**: npm

### 4. **Arquivos de Configuração:**
- ✅ `startup.sh` - Script de inicialização para Linux
- ✅ `azure-package.json` - Package.json otimizado para Azure
- ✅ Migrations incluídas para criar schema do banco

### 5. **Diferenças Windows vs Linux:**

| Aspecto | Windows (Dev) | Linux (Azure) |
|---------|---------------|---------------|
| Separador de caminho | `\` | `/` |
| Scripts shell | PowerShell | Bash |
| Case sensitivity | Não | **Sim** |
| Quebra de linha | CRLF | **LF** |
| Permissões | NTFS | Unix |

### 6. **Configurações do App Service:**

**General Settings:**
- Platform: Linux
- Node.js Version: 18-lts
- Always On: Enabled
- HTTP Version: 2.0

**Application Settings:**
```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...
SESSION_SECRET=...
WEBSITE_NODE_DEFAULT_VERSION=18-lts
```

**Startup Command:**
```bash
chmod +x startup.sh && ./startup.sh
```

### 7. **Estrutura de Deploy:**
```
/home/site/wwwroot/
├── dist/
│   ├── index.js (servidor)
│   └── public/ (frontend)
├── migrations/
├── node_modules/
├── package.json
└── startup.sh
```

### 8. **Troubleshooting Linux:**

**Logs de Deployment:**
- Azure Portal > App Service > Deployment Center > Logs
- Azure Portal > App Service > Log Stream

**Logs da Aplicação:**
```bash
tail -f /home/LogFiles/application.log
```

**Verificar Status:**
```bash
ps aux | grep node
netstat -tulpn | grep 8080
```

### 9. **Checklist Pré-Deploy:**

- ✅ Variáveis de ambiente configuradas
- ✅ CONNECTION_STRING do PostgreSQL válida
- ✅ Startup script com permissões corretas
- ✅ Build funcionando localmente
- ✅ Migrations testadas
- ✅ Porta 8080 configurada

### 10. **Comandos de Deploy:**

**Via Azure CLI:**
```bash
az webapp up --name seu-app-name --resource-group seu-rg --runtime "NODE:18-lts"
```

**Via Git Deploy:**
```bash
git remote add azure https://seu-app.scm.azurewebsites.net:443/seu-app.git
git push azure main:master
```
